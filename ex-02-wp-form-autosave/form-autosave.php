<?php
/**
 * Plugin Name: Form AutoSave & Recovery
 * Plugin URI: https://github.com/your-repo/ex-02-wp-form-autosave
 * Description: Never lose form data again! Automatically saves form progress in user's browser and offers to restore on page reload. Works with Contact Form 7, WPForms, Gravity Forms, and any HTML form.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://your-website.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: form-autosave
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('FORM_AUTOSAVE_VERSION', '1.0.0');
define('FORM_AUTOSAVE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FORM_AUTOSAVE_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Plugin Class
 */
class Form_AutoSave {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Enqueue scripts and styles on frontend
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));

        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // Settings
        add_action('admin_init', array($this, 'register_settings'));

        // Enqueue admin scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // Add settings link on plugins page
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
    }

    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_assets() {
        // Only load on pages with forms
        if (!$this->should_load_assets()) {
            return;
        }

        // Enqueue CSS
        wp_enqueue_style(
            'form-autosave-css',
            FORM_AUTOSAVE_PLUGIN_URL . 'assets/css/form-autosave.css',
            array(),
            FORM_AUTOSAVE_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'form-autosave-js',
            FORM_AUTOSAVE_PLUGIN_URL . 'assets/js/form-autosave.js',
            array(),
            FORM_AUTOSAVE_VERSION,
            true
        );

        // Pass settings to JavaScript
        wp_localize_script('form-autosave-js', 'formAutosaveConfig', array(
            'enabled' => $this->get_option('enabled', true),
            'expiration' => $this->get_option('expiration', 48), // hours
            'excludeFields' => $this->get_excluded_fields(),
            'showNotification' => $this->get_option('show_notification', true),
            'notificationText' => __('We found a previously saved entry. Would you like to restore it?', 'form-autosave'),
            'restoreButtonText' => __('Restore', 'form-autosave'),
            'dismissButtonText' => __('Dismiss', 'form-autosave'),
            'debug' => $this->get_option('debug_mode', false)
        ));
    }

    /**
     * Check if assets should be loaded on current page
     */
    private function should_load_assets() {
        // Always load if enabled globally
        if ($this->get_option('load_everywhere', false)) {
            return true;
        }

        // Load on pages with forms (basic detection)
        global $post;
        if (is_singular() && $post) {
            // Check if page/post content has form tags
            if (has_shortcode($post->post_content, 'contact-form-7') ||
                has_shortcode($post->post_content, 'wpforms') ||
                has_shortcode($post->post_content, 'gravityform') ||
                has_shortcode($post->post_content, 'formidable') ||
                strpos($post->post_content, '<form') !== false) {
                return true;
            }
        }

        // Load on WooCommerce checkout
        if (function_exists('is_checkout') && is_checkout()) {
            return true;
        }

        return apply_filters('form_autosave_should_load', false);
    }

    /**
     * Get excluded fields (password, credit card, etc.)
     */
    private function get_excluded_fields() {
        $default_excluded = array(
            'password',
            'password_confirmation',
            'credit_card',
            'cvv',
            'card_number',
            'security_code',
            'ssn',
            'social_security'
        );

        $custom_excluded = $this->get_option('excluded_fields', '');
        if (!empty($custom_excluded)) {
            $custom_array = array_map('trim', explode(',', $custom_excluded));
            $default_excluded = array_merge($default_excluded, $custom_array);
        }

        return apply_filters('form_autosave_excluded_fields', $default_excluded);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Form AutoSave Settings', 'form-autosave'),
            __('Form AutoSave', 'form-autosave'),
            'manage_options',
            'form-autosave',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('form_autosave_settings', 'form_autosave_options', array(
            'sanitize_callback' => array($this, 'sanitize_settings')
        ));

        // General Settings Section
        add_settings_section(
            'form_autosave_general',
            __('General Settings', 'form-autosave'),
            array($this, 'render_general_section'),
            'form-autosave'
        );

        // Enable/Disable
        add_settings_field(
            'enabled',
            __('Enable AutoSave', 'form-autosave'),
            array($this, 'render_checkbox_field'),
            'form-autosave',
            'form_autosave_general',
            array('name' => 'enabled', 'default' => true)
        );

        // Expiration
        add_settings_field(
            'expiration',
            __('Data Expiration', 'form-autosave'),
            array($this, 'render_expiration_field'),
            'form-autosave',
            'form_autosave_general'
        );

        // Show notification
        add_settings_field(
            'show_notification',
            __('Show Restore Notification', 'form-autosave'),
            array($this, 'render_checkbox_field'),
            'form-autosave',
            'form_autosave_general',
            array('name' => 'show_notification', 'default' => true)
        );

        // Load everywhere
        add_settings_field(
            'load_everywhere',
            __('Load on All Pages', 'form-autosave'),
            array($this, 'render_checkbox_field'),
            'form-autosave',
            'form_autosave_general',
            array('name' => 'load_everywhere', 'default' => false, 'description' => __('By default, the plugin only loads on pages with forms. Enable this to load everywhere.', 'form-autosave'))
        );

        // Excluded fields
        add_settings_field(
            'excluded_fields',
            __('Excluded Fields', 'form-autosave'),
            array($this, 'render_excluded_fields'),
            'form-autosave',
            'form_autosave_general'
        );

        // Debug mode
        add_settings_field(
            'debug_mode',
            __('Debug Mode', 'form-autosave'),
            array($this, 'render_checkbox_field'),
            'form-autosave',
            'form_autosave_general',
            array('name' => 'debug_mode', 'default' => false, 'description' => __('Enable console logging for troubleshooting.', 'form-autosave'))
        );
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();

        $sanitized['enabled'] = !empty($input['enabled']);
        $sanitized['show_notification'] = !empty($input['show_notification']);
        $sanitized['load_everywhere'] = !empty($input['load_everywhere']);
        $sanitized['debug_mode'] = !empty($input['debug_mode']);
        $sanitized['expiration'] = absint($input['expiration']);
        $sanitized['excluded_fields'] = sanitize_textarea_field($input['excluded_fields']);

        return $sanitized;
    }

    /**
     * Render general section description
     */
    public function render_general_section() {
        echo '<p>' . __('Configure how Form AutoSave works on your website.', 'form-autosave') . '</p>';
    }

    /**
     * Render checkbox field
     */
    public function render_checkbox_field($args) {
        $name = $args['name'];
        $default = isset($args['default']) ? $args['default'] : false;
        $description = isset($args['description']) ? $args['description'] : '';
        $value = $this->get_option($name, $default);

        echo '<label>';
        echo '<input type="checkbox" name="form_autosave_options[' . esc_attr($name) . ']" value="1" ' . checked($value, true, false) . ' />';
        echo ' ' . esc_html($description);
        echo '</label>';
    }

    /**
     * Render expiration field
     */
    public function render_expiration_field() {
        $value = $this->get_option('expiration', 48);
        ?>
        <select name="form_autosave_options[expiration]">
            <option value="24" <?php selected($value, 24); ?>>24 hours</option>
            <option value="48" <?php selected($value, 48); ?>>48 hours (recommended)</option>
            <option value="72" <?php selected($value, 72); ?>>72 hours</option>
            <option value="168" <?php selected($value, 168); ?>>7 days</option>
        </select>
        <p class="description"><?php _e('How long to keep saved form data in browser before auto-deleting.', 'form-autosave'); ?></p>
        <?php
    }

    /**
     * Render excluded fields
     */
    public function render_excluded_fields() {
        $value = $this->get_option('excluded_fields', '');
        ?>
        <textarea name="form_autosave_options[excluded_fields]" rows="3" cols="50" class="large-text"><?php echo esc_textarea($value); ?></textarea>
        <p class="description">
            <?php _e('Comma-separated list of field names to exclude from auto-save (e.g., api_key, secret_token). Password and credit card fields are excluded by default.', 'form-autosave'); ?>
        </p>
        <?php
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Save settings
        if (isset($_GET['settings-updated'])) {
            add_settings_error(
                'form_autosave_messages',
                'form_autosave_message',
                __('Settings saved successfully.', 'form-autosave'),
                'updated'
            );
        }

        settings_errors('form_autosave_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="form-autosave-header">
                <h2><?php _e('Never Lose Form Data Again!', 'form-autosave'); ?></h2>
                <p><?php _e('This plugin automatically saves form progress in the user\'s browser (100% private - data never leaves their device) and offers to restore it if they accidentally close the page.', 'form-autosave'); ?></p>
            </div>

            <form action="options.php" method="post">
                <?php
                settings_fields('form_autosave_settings');
                do_settings_sections('form-autosave');
                submit_button(__('Save Settings', 'form-autosave'));
                ?>
            </form>

            <div class="form-autosave-info">
                <h2><?php _e('How It Works', 'form-autosave'); ?></h2>
                <ol>
                    <li><?php _e('User fills out a form on your website', 'form-autosave'); ?></li>
                    <li><?php _e('Form data is automatically saved to their browser\'s localStorage (every 1 second)', 'form-autosave'); ?></li>
                    <li><?php _e('If they close the page accidentally, saved data is kept for the configured expiration time', 'form-autosave'); ?></li>
                    <li><?php _e('When they return, a notification asks "Restore previous entry?"', 'form-autosave'); ?></li>
                    <li><?php _e('User clicks "Restore" and all their data is filled back in!', 'form-autosave'); ?></li>
                    <li><?php _e('Data is deleted after successful form submission or expiration', 'form-autosave'); ?></li>
                </ol>

                <h3><?php _e('Compatible With', 'form-autosave'); ?></h3>
                <ul>
                    <li>✅ Contact Form 7</li>
                    <li>✅ WPForms</li>
                    <li>✅ Gravity Forms</li>
                    <li>✅ Formidable Forms</li>
                    <li>✅ Ninja Forms</li>
                    <li>✅ WooCommerce Checkout</li>
                    <li>✅ Any HTML form on your website</li>
                </ul>

                <h3><?php _e('Privacy & Security', 'form-autosave'); ?></h3>
                <p>✅ <strong><?php _e('100% GDPR Compliant', 'form-autosave'); ?></strong> - <?php _e('All data is stored in the user\'s browser, never sent to your server', 'form-autosave'); ?></p>
                <p>✅ <strong><?php _e('Sensitive Fields Protected', 'form-autosave'); ?></strong> - <?php _e('Passwords, credit cards, and other sensitive fields are never saved', 'form-autosave'); ?></p>
                <p>✅ <strong><?php _e('Auto-Expiration', 'form-autosave'); ?></strong> - <?php _e('Data automatically deleted after configured time', 'form-autosave'); ?></p>
            </div>
        </div>

        <style>
            .form-autosave-header {
                background: #f0f6fc;
                border-left: 4px solid #2271b1;
                padding: 20px;
                margin: 20px 0;
            }
            .form-autosave-info {
                background: #fff;
                border: 1px solid #ccc;
                padding: 20px;
                margin-top: 30px;
            }
            .form-autosave-info h2 {
                margin-top: 0;
            }
            .form-autosave-info ul,
            .form-autosave-info ol {
                line-height: 1.8;
            }
        </style>
        <?php
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ('settings_page_form-autosave' !== $hook) {
            return;
        }
        // Admin-specific styles can be added here if needed
    }

    /**
     * Add settings link to plugins page
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="options-general.php?page=form-autosave">' . __('Settings', 'form-autosave') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Get plugin option
     */
    private function get_option($name, $default = null) {
        $options = get_option('form_autosave_options', array());
        return isset($options[$name]) ? $options[$name] : $default;
    }
}

// Initialize plugin
function form_autosave_init() {
    return Form_AutoSave::get_instance();
}

// Hook into WordPress
add_action('plugins_loaded', 'form_autosave_init');

// Activation hook
register_activation_hook(__FILE__, 'form_autosave_activate');
function form_autosave_activate() {
    // Set default options
    $default_options = array(
        'enabled' => true,
        'expiration' => 48,
        'show_notification' => true,
        'load_everywhere' => false,
        'excluded_fields' => '',
        'debug_mode' => false
    );

    add_option('form_autosave_options', $default_options);
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'form_autosave_deactivate');
function form_autosave_deactivate() {
    // Cleanup if needed (optional)
}
