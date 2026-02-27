<?php
/**
 * Plugin Name: Plato Core
 * Description: Plato AI Tutor — REST API backend for the Plato PWA.
 * Version:     1.0.0
 * Author:      Plato
 * Text Domain: plato-core
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'PLATO_VERSION', '1.4.0' );
define( 'PLATO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'PLATO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Encryption key — deferred until WordPress is fully loaded.
function plato_get_encryption_key(): string {
    return defined( 'AUTH_KEY' ) ? AUTH_KEY : 'plato-fallback-key-change-me';
}

// ─── Composer Autoload ───────────────────────────────────────────────────────

if ( file_exists( PLATO_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
    require_once PLATO_PLUGIN_DIR . 'vendor/autoload.php';
}

// ─── Class Loader ────────────────────────────────────────────────────────────

require_once PLATO_PLUGIN_DIR . 'includes/class-database.php';
require_once PLATO_PLUGIN_DIR . 'includes/class-auth.php';
require_once PLATO_PLUGIN_DIR . 'includes/class-canvas.php';
require_once PLATO_PLUGIN_DIR . 'includes/class-llm.php';
require_once PLATO_PLUGIN_DIR . 'includes/class-document-processor.php';
require_once PLATO_PLUGIN_DIR . 'includes/class-api.php';

// ─── PHP Upload Limits ──────────────────────────────────────────────────────
// Raise PHP limits so lecture slides (often 30-50 MB) can be uploaded.
@ini_set( 'upload_max_filesize', '64M' );
@ini_set( 'post_max_size', '64M' );
@ini_set( 'max_execution_time', '300' );
@ini_set( 'max_input_time', '300' );

add_filter( 'upload_size_limit', function () {
    return 64 * 1024 * 1024; // 64 MB
} );

// ─── Activation ──────────────────────────────────────────────────────────────

register_activation_hook( __FILE__, 'plato_activate' );

function plato_activate(): void {
    Plato_Database::create_tables();
}

// Run migrations on admin_init or REST API init if DB version changed (handles upgrades).
add_action( 'admin_init', 'plato_maybe_migrate' );
add_action( 'rest_api_init', 'plato_maybe_migrate', 5 );

function plato_maybe_migrate(): void {
    if ( Plato_Database::get_db_version() !== PLATO_VERSION ) {
        Plato_Database::create_tables();
    }
}

// ─── REST API ────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {
    $api = new Plato_API();
    $api->register_routes();
} );

// ─── CORS ────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {
    // Remove default WP CORS and set our own.
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );

    add_filter( 'rest_pre_serve_request', function ( $value ) {
        $allowed_origins = array(
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://plato.local',
            'https://pwa-chi-six-32.vercel.app',
            'https://plato.mojosamurai.com',
        );

        $origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';

        // Also allow any Vercel preview deployment for this project.
        $is_vercel = preg_match( '/^https:\/\/pwa[-a-z0-9]*\.vercel\.app$/', $origin );

        if ( in_array( $origin, $allowed_origins, true ) || $is_vercel ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
            header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
            header( 'Access-Control-Allow-Credentials: true' );
        }

        return $value;
    } );
}, 15 );

// Handle preflight OPTIONS requests.
add_action( 'init', function () {
    if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
        $allowed_origins = array(
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://plato.local',
            'https://pwa-chi-six-32.vercel.app',
            'https://plato.mojosamurai.com',
        );

        $origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';

        // Also allow any Vercel preview deployment for this project.
        $is_vercel = preg_match( '/^https:\/\/pwa[-a-z0-9]*\.vercel\.app$/', $origin );

        if ( in_array( $origin, $allowed_origins, true ) || $is_vercel ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
            header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
            header( 'Access-Control-Allow-Credentials: true' );
            header( 'Access-Control-Max-Age: 86400' );
            status_header( 204 );
            exit;
        }
    }
} );

// ─── WP-Cron: Canvas Sync ───────────────────────────────────────────────────

add_filter( 'cron_schedules', function ( array $schedules ): array {
    $schedules['plato_6hours'] = array(
        'interval' => 21600,
        'display'  => 'Every 6 Hours',
    );
    return $schedules;
} );

add_action( 'init', function () {
    if ( ! wp_next_scheduled( 'plato_canvas_sync' ) ) {
        wp_schedule_event( time(), 'plato_6hours', 'plato_canvas_sync' );
    }
} );

add_action( 'plato_canvas_sync', 'plato_run_canvas_sync' );

function plato_run_canvas_sync(): void {
    $users = get_users( array(
        'meta_key' => 'plato_canvas_token',
        'fields'   => 'ID',
    ) );

    foreach ( $users as $user_id ) {
        $canvas = new Plato_Canvas( (int) $user_id );
        $canvas->sync_all();

        // Also sync course content (modules/pages) into study notes.
        $canvas->sync_content();
    }
}

// ─── WP-Cron: Document Processing (P3) ──────────────────────────────────────

add_action( 'plato_process_documents', 'plato_run_document_processing' );

function plato_run_document_processing(): void {
    $pending = Plato_Database::get_pending_notes( 10 );
    foreach ( $pending as $note ) {
        Plato_Document_Processor::process_document( $note->id );
        sleep( 2 ); // Rate-limit between LLM summarization calls.
    }

    // If more pending, schedule another run.
    $remaining = Plato_Database::get_pending_notes( 1 );
    if ( ! empty( $remaining ) ) {
        wp_schedule_single_event( time() + 10, 'plato_process_documents' );
    }
}

// ─── Encryption Helpers ──────────────────────────────────────────────────────

function plato_encrypt( string $plain_text ): string {
    $key    = hash( 'sha256', plato_get_encryption_key(), true );
    $iv     = openssl_random_pseudo_bytes( 16 );
    $cipher = openssl_encrypt( $plain_text, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );

    return base64_encode( $iv . $cipher );
}

function plato_decrypt( string $encrypted_text ): string|false {
    $data = base64_decode( $encrypted_text, true );
    if ( $data === false || strlen( $data ) < 17 ) {
        return false;
    }

    $key    = hash( 'sha256', plato_get_encryption_key(), true );
    $iv     = substr( $data, 0, 16 );
    $cipher = substr( $data, 16 );

    $result = openssl_decrypt( $cipher, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );

    return $result !== false ? $result : false;
}

// ─── Deactivation ────────────────────────────────────────────────────────────

register_deactivation_hook( __FILE__, function () {
    wp_clear_scheduled_hook( 'plato_canvas_sync' );
    wp_clear_scheduled_hook( 'plato_process_documents' );
} );
