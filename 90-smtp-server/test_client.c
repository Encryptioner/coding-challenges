/*
 * Simple SMTP Test Client
 * Used for testing the CC SMTP Server
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define BUFFER_SIZE 4096

void send_command(int sock, const char *cmd) {
    printf("C: %s\n", cmd);
    send(sock, cmd, strlen(cmd), 0);
}

int receive_response(int sock, char *buffer, size_t size) {
    int n = recv(sock, buffer, size - 1, 0);
    if (n > 0) {
        buffer[n] = '\0';
        printf("S: %s", buffer);
        return 1;
    }
    return 0;
}

int main(int argc, char *argv[]) {
    int sock;
    struct sockaddr_in server_addr;
    char buffer[BUFFER_SIZE];
    int port = 2525;
    const char *host = "127.0.0.1";

    /* Parse arguments */
    if (argc > 1) {
        host = argv[1];
    }
    if (argc > 2) {
        port = atoi(argv[2]);
    }

    /* Create socket */
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        perror("socket");
        return 1;
    }

    /* Connect to server */
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    if (inet_pton(AF_INET, host, &server_addr.sin_addr) <= 0) {
        perror("inet_pton");
        close(sock);
        return 1;
    }

    if (connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("connect");
        close(sock);
        return 1;
    }

    printf("Connected to %s:%d\n", host, port);

    /* Receive greeting */
    receive_response(sock, buffer, sizeof(buffer));

    /* Send HELO */
    send_command(sock, "HELO testclient\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    /* Send MAIL FROM */
    send_command(sock, "MAIL FROM:<sender@example.com>\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    /* Send RCPT TO */
    send_command(sock, "RCPT TO:<recipient@example.com>\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    /* Send DATA */
    send_command(sock, "DATA\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    /* Send email body */
    send_command(sock, "Subject: Test Email\r\n");
    send_command(sock, "From: sender@example.com\r\n");
    send_command(sock, "To: recipient@example.com\r\n");
    send_command(sock, "\r\n");
    send_command(sock, "This is a test email from the SMTP test client.\r\n");
    send_command(sock, "It has multiple lines.\r\n");
    send_command(sock, "\r\n");
    send_command(sock, "Best regards,\r\n");
    send_command(sock, "Test Client\r\n");
    send_command(sock, ".\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    /* Send QUIT */
    send_command(sock, "QUIT\r\n");
    receive_response(sock, buffer, sizeof(buffer));

    close(sock);
    printf("\nTest completed successfully!\n");
    return 0;
}
