<?php
/**
 * Plato_Auth
 *
 * JWT token generation and validation using HMAC-SHA256.
 * No external dependencies — uses WordPress native functions.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Auth {

    const TOKEN_EXPIRY = 7 * DAY_IN_SECONDS; // 7 days.

    /**
     * Get the HMAC signing secret.
     */
    private static function get_secret(): string {
        return wp_salt( 'auth' );
    }

    /**
     * Base64url encode (URL-safe, no padding).
     */
    private static function base64url_encode( string $data ): string {
        return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
    }

    /**
     * Base64url decode.
     */
    private static function base64url_decode( string $data ): string|false {
        $remainder = strlen( $data ) % 4;
        if ( $remainder ) {
            $data .= str_repeat( '=', 4 - $remainder );
        }
        return base64_decode( strtr( $data, '-_', '+/' ) );
    }

    /**
     * Generate a JWT for the given user.
     */
    public static function generate_token( int $user_id ): string {
        $header = self::base64url_encode( wp_json_encode( array(
            'alg' => 'HS256',
            'typ' => 'JWT',
        ) ) );

        $payload = self::base64url_encode( wp_json_encode( array(
            'iss'     => get_site_url(),
            'iat'     => time(),
            'exp'     => time() + self::TOKEN_EXPIRY,
            'user_id' => $user_id,
        ) ) );

        $signature = self::base64url_encode(
            hash_hmac( 'sha256', "$header.$payload", self::get_secret(), true )
        );

        return "$header.$payload.$signature";
    }

    /**
     * Validate a JWT and return the user_id.
     *
     * @return int|WP_Error User ID on success, WP_Error on failure.
     */
    public static function validate_token( string $token ): int|WP_Error {
        $parts = explode( '.', $token );
        if ( count( $parts ) !== 3 ) {
            return new WP_Error( 'plato_token_invalid', 'Malformed token.', array( 'status' => 401 ) );
        }

        list( $header, $payload, $signature ) = $parts;

        // Verify signature (timing-safe comparison).
        $expected = self::base64url_encode(
            hash_hmac( 'sha256', "$header.$payload", self::get_secret(), true )
        );

        if ( ! hash_equals( $expected, $signature ) ) {
            return new WP_Error( 'plato_token_invalid', 'Invalid token signature.', array( 'status' => 401 ) );
        }

        // Decode payload.
        $decoded = json_decode( self::base64url_decode( $payload ), true );
        if ( ! $decoded || empty( $decoded['user_id'] ) || empty( $decoded['exp'] ) ) {
            return new WP_Error( 'plato_token_invalid', 'Invalid token payload.', array( 'status' => 401 ) );
        }

        // Check expiry.
        if ( $decoded['exp'] < time() ) {
            return new WP_Error( 'plato_token_expired', 'Token has expired.', array( 'status' => 401 ) );
        }

        // Verify user still exists.
        $user = get_user_by( 'id', $decoded['user_id'] );
        if ( ! $user ) {
            return new WP_Error( 'plato_token_invalid', 'User not found.', array( 'status' => 401 ) );
        }

        return (int) $decoded['user_id'];
    }

    /**
     * Extract Bearer token from the Authorization header.
     */
    public static function get_token_from_request(): string|false {
        $auth_header = '';

        // Try standard header first.
        if ( isset( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif ( isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif ( function_exists( 'getallheaders' ) ) {
            $headers = getallheaders();
            if ( isset( $headers['Authorization'] ) ) {
                $auth_header = $headers['Authorization'];
            }
        }

        if ( empty( $auth_header ) || ! str_starts_with( $auth_header, 'Bearer ' ) ) {
            return false;
        }

        return trim( substr( $auth_header, 7 ) );
    }

    /**
     * Authenticate the current request and return user_id.
     *
     * @return int|WP_Error User ID on success, WP_Error on failure.
     */
    public static function get_current_user_id(): int|WP_Error {
        $token = self::get_token_from_request();

        if ( ! $token ) {
            return new WP_Error(
                'plato_no_token',
                'Authorization header missing or invalid.',
                array( 'status' => 401 )
            );
        }

        return self::validate_token( $token );
    }
}
