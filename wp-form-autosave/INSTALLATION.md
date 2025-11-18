# Installation Guide - Form AutoSave & Recovery

## Quick Start (3 Steps)

### Step 1: Download Plugin

Choose one of these methods:

**Option A: Download ZIP**
1. Click the green "Code" button on GitHub
2. Select "Download ZIP"
3. Save `coding-challenges-main.zip` to your computer

**Option B: Clone Repository**
```bash
git clone https://github.com/your-repo/coding-challenges.git
cd coding-challenges/wp-form-autosave
```

### Step 2: Install in WordPress

**Via WordPress Admin (Recommended):**

1. Log in to WordPress admin panel
2. Go to **Plugins → Add New**
3. Click **Upload Plugin** button
4. Click **Choose File** and select the ZIP file
5. Click **Install Now**
6. Click **Activate Plugin**

**Via FTP/File Manager:**

1. Unzip the downloaded file
2. Locate the `wp-form-autosave` folder
3. Upload to `/wp-content/plugins/` directory
4. Go to WordPress admin → **Plugins**
5. Find "Form AutoSave & Recovery" and click **Activate**

### Step 3: Configure (Optional)

1. Go to **Settings → Form AutoSave**
2. Adjust settings if needed (defaults work great!)
3. Click **Save Settings**

**That's it!** Your forms now auto-save. 🎉

---

## Detailed Installation Steps

### Prerequisites

Before installing, ensure you have:

- ✅ WordPress 5.0 or higher
- ✅ PHP 7.0 or higher
- ✅ Admin access to WordPress
- ✅ Modern web browser with localStorage support

### Method 1: WordPress Admin Upload

**Best for:** Most users, non-technical users

1. **Download the Plugin**
   - Download from GitHub or WordPress.org
   - You should have a file named `form-autosave.zip` or `wp-form-autosave.zip`

2. **Access WordPress Admin**
   - Log in to your WordPress site
   - URL typically: `https://yoursite.com/wp-admin`

3. **Navigate to Plugins**
   - Click **Plugins** in left sidebar
   - Click **Add New**

4. **Upload Plugin**
   - Click **Upload Plugin** button (top of page)
   - Click **Choose File**
   - Select your downloaded ZIP file
   - Click **Install Now**

5. **Wait for Installation**
   - WordPress will upload and extract the plugin
   - This usually takes 5-10 seconds

6. **Activate Plugin**
   - Click **Activate Plugin** button
   - You should see "Plugin activated" message

7. **Verify Installation**
   - Go to **Settings → Form AutoSave**
   - You should see the settings page
   - If you see settings, installation was successful! ✅

### Method 2: FTP/SFTP Upload

**Best for:** Users comfortable with FTP, developers

1. **Download and Extract**
   ```bash
   # Download
   wget https://github.com/your-repo/coding-challenges/archive/main.zip

   # Extract
   unzip main.zip
   cd coding-challenges-main/wp-form-autosave
   ```

2. **Connect via FTP**
   - Use FileZilla, Cyberduck, or your hosting file manager
   - Connect to your WordPress site

3. **Navigate to Plugins Directory**
   ```
   /wp-content/plugins/
   ```

4. **Upload Plugin Folder**
   - Upload the entire `wp-form-autosave` folder
   - Ensure folder structure is:
     ```
     /wp-content/plugins/wp-form-autosave/
     ├── form-autosave.php
     ├── assets/
     │   ├── js/
     │   └── css/
     ├── includes/
     └── README.md
     ```

5. **Set Permissions** (if needed)
   ```bash
   chmod 755 wp-form-autosave
   chmod 644 wp-form-autosave/form-autosave.php
   ```

6. **Activate in WordPress**
   - Go to **Plugins** in WordPress admin
   - Find "Form AutoSave & Recovery"
   - Click **Activate**

### Method 3: WP-CLI

**Best for:** Developers, command-line users

1. **SSH into Server**
   ```bash
   ssh user@yourserver.com
   cd /var/www/html/wp-content/plugins
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-repo/coding-challenges.git temp
   mv temp/wp-form-autosave ./
   rm -rf temp
   ```

3. **Activate Plugin**
   ```bash
   wp plugin activate wp-form-autosave
   ```

4. **Verify**
   ```bash
   wp plugin list | grep form-autosave
   ```

   You should see:
   ```
   wp-form-autosave  1.0.0  active
   ```

### Method 4: Composer (Advanced)

**Best for:** Sites using Composer for WordPress

Add to your `composer.json`:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/your-repo/coding-challenges"
    }
  ],
  "require": {
    "your-repo/wp-form-autosave": "^1.0"
  }
}
```

Then run:
```bash
composer install
wp plugin activate wp-form-autosave
```

---

## Post-Installation Configuration

### Initial Setup

After activation, configure the plugin:

1. **Navigate to Settings**
   - Go to **Settings → Form AutoSave** in WordPress admin

2. **Review Default Settings**
   ```
   ✅ Enable AutoSave: ON
   ⏰ Data Expiration: 48 hours
   🔔 Show Restore Notification: ON
   📄 Load on All Pages: OFF (recommended)
   🔒 Excluded Fields: (default sensitive fields)
   🐛 Debug Mode: OFF
   ```

3. **Customize If Needed**
   - Most sites work great with defaults
   - Consider enabling "Load on All Pages" if forms are on many pages
   - Add custom excluded fields if you have sensitive custom fields

4. **Save Settings**
   - Click **Save Settings** button
   - You should see "Settings saved successfully"

### Testing the Plugin

1. **Find a Form on Your Site**
   - Navigate to any page with a form
   - Contact page, registration page, etc.

2. **Fill Out the Form Partially**
   - Enter some data in the fields
   - Don't submit yet!

3. **Close the Page/Tab**
   - Close the browser tab (or entire browser)
   - Wait a few seconds

4. **Return to the Form**
   - Go back to the same form page

5. **Check for Notification**
   - You should see a blue notification box:
     > "We found a previously saved entry. Would you like to restore it?"
   - Two buttons: **Restore** and **Dismiss**

6. **Click Restore**
   - All your previously entered data should reappear!
   - You should see a green toast: "Form data restored successfully!"

7. **Test Complete!** ✅
   - If you see this behavior, the plugin is working correctly

---

## Troubleshooting

### Plugin Not Appearing After Upload

**Problem:** Plugin doesn't show up in Plugins list

**Solutions:**
1. Check folder structure - must be `/wp-content/plugins/wp-form-autosave/`
2. Ensure `form-autosave.php` is in the root of plugin folder
3. Check file permissions (755 for folders, 644 for files)
4. Reload the Plugins page (Ctrl+F5)

### Activation Error

**Problem:** "Plugin could not be activated because it triggered a fatal error"

**Solutions:**
1. Check PHP version (requires 7.0+):
   ```bash
   php -v
   ```
2. Check error logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```
3. Ensure no plugin conflicts:
   - Deactivate all plugins
   - Activate Form AutoSave
   - Reactivate other plugins one by one

### Settings Page Not Showing

**Problem:** Can't find Settings → Form AutoSave

**Solutions:**
1. Ensure plugin is activated
2. Check user role has `manage_options` capability
3. Clear browser cache and reload
4. Try accessing directly: `/wp-admin/options-general.php?page=form-autosave`

### Auto-Save Not Working

**Problem:** Form data not being saved

**Solutions:**

1. **Enable Debug Mode**
   - Go to Settings → Form AutoSave
   - Enable "Debug Mode"
   - Open browser console (F12)
   - Look for `[Form AutoSave]` messages

2. **Check localStorage**
   - Open browser console (F12)
   - Type: `localStorage`
   - Look for keys starting with `form_autosave_`

3. **Check Browser Compatibility**
   - Ensure browser supports localStorage
   - Test in Chrome/Firefox (guaranteed to work)

4. **Check for JavaScript Errors**
   - Open browser console (F12)
   - Look for red error messages
   - Report any errors as a bug

5. **Check Form Detection**
   - Go to Settings → Form AutoSave
   - Enable "Load on All Pages" temporarily
   - Test again

### Notification Not Showing

**Problem:** Data is saved but notification doesn't appear

**Solutions:**
1. Check setting: "Show Restore Notification" is ON
2. Check for CSS conflicts - another plugin might be hiding it
3. Inspect page - look for `.form-autosave-notification` element
4. Clear browser cache
5. Try on a different browser

---

## Uninstallation

### Remove Plugin

1. **Deactivate First**
   - Go to **Plugins** in WordPress admin
   - Find "Form AutoSave & Recovery"
   - Click **Deactivate**

2. **Delete Plugin**
   - Click **Delete** link (appears after deactivation)
   - Confirm deletion

### What Gets Deleted

When you delete the plugin:
- ✅ Plugin files are removed from server
- ✅ Plugin settings are removed from database
- ⚠️ User data in localStorage stays (it's in their browser, not your server)

### Clean Uninstall (Optional)

If you want to remove ALL traces:

```bash
# SSH into server
cd /var/www/html

# Remove plugin files
rm -rf wp-content/plugins/wp-form-autosave

# Remove database options
wp option delete form_autosave_options
```

---

## Upgrading

### Automatic Updates (Future)

Once published on WordPress.org, you'll get automatic update notifications.

### Manual Update

1. **Deactivate Current Version**
   - Don't delete, just deactivate

2. **Upload New Version**
   - Upload new ZIP via Plugins → Add New → Upload
   - Overwrite existing files when prompted

3. **Reactivate Plugin**
   - Settings are preserved!

---

## Multi-Site Installation

### Network Activation

1. **Upload Plugin**
   - Use any method above
   - Upload to `/wp-content/plugins/`

2. **Network Activate**
   - Go to **Network Admin → Plugins**
   - Click **Network Activate** for Form AutoSave

3. **Configure Per-Site** (Optional)
   - Each site can have its own settings
   - Go to individual site admin → Settings → Form AutoSave

---

## Development Installation

For developers who want to contribute:

```bash
# Clone repository
git clone https://github.com/your-repo/coding-challenges.git
cd coding-challenges/wp-form-autosave

# Symlink to WordPress plugins directory
ln -s $(pwd) /path/to/wordpress/wp-content/plugins/wp-form-autosave

# Activate via WP-CLI
wp plugin activate wp-form-autosave

# Enable debug mode
wp option patch update form_autosave_options debug_mode 1
```

---

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/your-repo/coding-challenges/issues)
- 💬 [Community Support](https://wordpress.org/support/plugin/form-autosave)

---

**Estimated Installation Time:** 2-5 minutes

**Difficulty:** ⭐ Easy (suitable for beginners)
