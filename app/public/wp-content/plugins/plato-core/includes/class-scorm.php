<?php
/**
 * Plato_Scorm
 *
 * SCORM package management and xAPI tracking helpers.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Scorm {

    // ─── Package CRUD ─────────────────────────────────────────────────────────

    /**
     * Get all packages, optionally filtered by course_id.
     */
    public static function get_packages( int $user_id, ?int $course_id = null ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_packages';

        if ( $course_id ) {
            return $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM $table WHERE user_id = %d AND course_id = %d ORDER BY created_at DESC",
                $user_id,
                $course_id
            ) );
        }

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ) );
    }

    /**
     * Get a single package by ID.
     */
    public static function get_package( int $id ): ?object {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_packages';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $id
        ) );
    }

    /**
     * Insert a new package.
     */
    public static function insert_package( array $data ): int|false {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_packages';

        $result = $wpdb->insert( $table, $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    // ─── Tracking ─────────────────────────────────────────────────────────────

    /**
     * Insert an xAPI tracking statement.
     */
    public static function insert_tracking( array $data ): int|false {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_tracking';

        $result = $wpdb->insert( $table, $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    /**
     * Get tracking statements for a package.
     */
    public static function get_statements( int $user_id, int $package_id, int $limit = 100 ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_tracking';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d AND package_id = %d ORDER BY created_at DESC LIMIT %d",
            $user_id,
            $package_id,
            $limit
        ) );
    }

    // ─── Progress Aggregation ─────────────────────────────────────────────────

    /**
     * Get aggregated progress for a package.
     */
    public static function get_progress( int $user_id, int $package_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_tracking';

        // Total time spent (sum of durations)
        $total_statements = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE user_id = %d AND package_id = %d",
            $user_id,
            $package_id
        ) );

        // Latest score
        $latest_score = $wpdb->get_var( $wpdb->prepare(
            "SELECT result_score FROM $table WHERE user_id = %d AND package_id = %d AND result_score IS NOT NULL ORDER BY created_at DESC LIMIT 1",
            $user_id,
            $package_id
        ) );

        // Completion: count distinct activities that have result_complete = 1
        $completed_activities = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT activity_id) FROM $table WHERE user_id = %d AND package_id = %d AND result_complete = 1",
            $user_id,
            $package_id
        ) );

        // Total distinct activities
        $total_activities = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT activity_id) FROM $table WHERE user_id = %d AND package_id = %d",
            $user_id,
            $package_id
        ) );

        // Time spent: sum result_duration values (ISO 8601 durations stored as strings)
        $durations = $wpdb->get_col( $wpdb->prepare(
            "SELECT result_duration FROM $table WHERE user_id = %d AND package_id = %d AND result_duration IS NOT NULL",
            $user_id,
            $package_id
        ) );

        $total_seconds = 0;
        foreach ( $durations as $dur ) {
            $total_seconds += self::parse_duration( $dur );
        }

        // Activity breakdown
        $activities = $wpdb->get_results( $wpdb->prepare(
            "SELECT activity_id, activity_name,
                    MAX(result_score) as best_score,
                    MAX(result_complete) as completed,
                    MAX(result_success) as passed,
                    COUNT(*) as attempts,
                    MAX(created_at) as last_attempt
             FROM $table
             WHERE user_id = %d AND package_id = %d
             GROUP BY activity_id, activity_name
             ORDER BY MIN(created_at) ASC",
            $user_id,
            $package_id
        ) );

        // Verbs summary
        $verbs = $wpdb->get_results( $wpdb->prepare(
            "SELECT verb, COUNT(*) as count FROM $table WHERE user_id = %d AND package_id = %d GROUP BY verb ORDER BY count DESC",
            $user_id,
            $package_id
        ) );

        $completion_pct = $total_activities > 0
            ? round( ( (int) $completed_activities / (int) $total_activities ) * 100, 1 )
            : 0;

        return array(
            'total_statements'      => (int) $total_statements,
            'completion_pct'        => $completion_pct,
            'completed_activities'  => (int) $completed_activities,
            'total_activities'      => (int) $total_activities,
            'latest_score'          => $latest_score !== null ? (float) $latest_score : null,
            'time_spent_seconds'    => $total_seconds,
            'time_spent_formatted'  => self::format_duration( $total_seconds ),
            'activities'            => $activities,
            'verbs'                 => $verbs,
        );
    }

    /**
     * Get a text summary of SCORM progress for AI context.
     */
    public static function get_ai_context( int $user_id ): string {
        global $wpdb;
        $pkg_table   = $wpdb->prefix . 'plato_scorm_packages';
        $track_table = $wpdb->prefix . 'plato_scorm_tracking';

        $packages = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $pkg_table WHERE user_id = %d AND status = 'active'",
            $user_id
        ) );

        if ( empty( $packages ) ) {
            return '';
        }

        $context = "SCORM INTERACTIVE MODULE PROGRESS:\n";

        foreach ( $packages as $pkg ) {
            $progress = self::get_progress( $user_id, (int) $pkg->id );
            $context .= "\n- Module: {$pkg->title}";
            $context .= "\n  Completion: {$progress['completion_pct']}%";
            if ( $progress['latest_score'] !== null ) {
                $context .= " | Latest Score: {$progress['latest_score']}%";
            }
            $context .= " | Time Spent: {$progress['time_spent_formatted']}";
            $context .= " | Activities: {$progress['completed_activities']}/{$progress['total_activities']} completed";

            // List activities with status
            if ( ! empty( $progress['activities'] ) ) {
                foreach ( $progress['activities'] as $act ) {
                    $status = $act->completed ? 'completed' : 'in progress';
                    if ( $act->passed ) {
                        $status = 'passed';
                    }
                    $score_str = $act->best_score !== null ? " (score: {$act->best_score}%)" : '';
                    $context .= "\n    - {$act->activity_name}: {$status}{$score_str}";
                }
            }
        }

        return $context;
    }

    // ─── Scenarios ──────────────────────────────────────────────────────────

    /**
     * Generate an AI-powered scenario for a SCORM package.
     */
    public static function generate_scenario( object $package, string $type, int $user_id ): array|WP_Error {
        global $wpdb;

        // Try to read the study guide HTML.
        $study_guide = '';
        $guide_path  = ABSPATH . "scorm-packages/{$package->slug}/study-guide.html";
        if ( file_exists( $guide_path ) ) {
            $study_guide = file_get_contents( $guide_path );
            // Strip HTML tags, keep text content.
            $study_guide = wp_strip_all_tags( $study_guide );
            // Truncate to prevent context overflow.
            if ( mb_strlen( $study_guide ) > 6000 ) {
                $study_guide = mb_substr( $study_guide, 0, 6000 ) . "\n... (truncated)";
            }
        }

        // Get xAPI tracking data for context.
        $progress = self::get_progress( $user_id, (int) $package->id );

        $type_prompts = array(
            'pre_assessment'  => "Generate a pre-assessment with 3-5 multiple-choice questions to gauge the student's prior knowledge BEFORE they begin this module. Questions should cover foundational concepts.",
            'quiz'            => "Generate a quiz with 5 multiple-choice questions testing comprehension of the module content. Include varied difficulty levels. Base questions on the study guide content provided.",
            'walkthrough'     => "Generate a guided walkthrough with 3-5 focus prompts that guide the student through the most important sections of this module. For each section, provide a guiding question and key concepts to look for.",
            'post_assessment' => "Generate a post-assessment with 5 questions (mix of multiple-choice and short answer) to evaluate how well the student understood the module after completing it. Compare areas where they may have struggled based on their activity data.",
            'review'          => "Generate a spaced review with 3-4 questions targeting the most important concepts from this module. Focus on concepts most likely to be forgotten. Include recall-based questions.",
            'myth_buster'     => "Generate a myth-busting exercise with 5-6 true/false questions targeting common MISCONCEPTIONS about this topic. Each statement should be something a beginner might believe but is actually wrong (or surprisingly correct). Use the true_false question type. Include a compelling explanation for each revealing why the common belief is wrong.",
            'real_world'      => "Generate 4-5 realistic scenario-based judgment questions. Each question presents a real-world situation the student might encounter and asks them to choose the BEST course of action from 4 options. Use the scenario_judgment question type with a scenario_context field describing the situation. Focus on practical decision-making and safety awareness.",
            'concept_match'   => "Generate a concept-matching exercise with 2-3 matching questions (match terms to definitions using the matching type with pairs field) AND 1-2 ordering questions (put items in the correct sequence using the ordering type with items field). Test vocabulary, classifications, and sequential understanding from the module content.",
        );

        $prompt = $type_prompts[ $type ] ?? $type_prompts['quiz'];

        $system = "You are Plato, an AI tutor generating assessment content for a SCORM learning module.\n\n"
                . "Module: {$package->title}\n";

        if ( ! empty( $study_guide ) ) {
            $system .= "\nStudy Guide Content:\n{$study_guide}\n";
        }

        if ( ! empty( $progress['activities'] ) ) {
            $system .= "\nStudent Progress:\n";
            $system .= "- Completion: {$progress['completion_pct']}%\n";
            $system .= "- Activities: {$progress['completed_activities']}/{$progress['total_activities']} completed\n";
            if ( $progress['latest_score'] !== null ) {
                $system .= "- Latest Score: {$progress['latest_score']}%\n";
            }
        }

        $system .= "\n{$prompt}\n\n"
                 . "IMPORTANT: Respond with valid JSON only. Use this exact format:\n"
                 . "{\n"
                 . "  \"title\": \"Scenario title\",\n"
                 . "  \"questions\": [\n"
                 . "    {\n"
                 . "      \"type\": \"mcq\",\n"
                 . "      \"question\": \"Question text\",\n"
                 . "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
                 . "      \"correct\": 0,\n"
                 . "      \"explanation\": \"Why this is correct\"\n"
                 . "    },\n"
                 . "    {\n"
                 . "      \"type\": \"short_answer\",\n"
                 . "      \"question\": \"Question text\",\n"
                 . "      \"sample_answer\": \"Expected answer keywords\",\n"
                 . "      \"explanation\": \"Key points to cover\"\n"
                 . "    },\n"
                 . "    {\n"
                 . "      \"type\": \"true_false\",\n"
                 . "      \"question\": \"Statement that is true or false\",\n"
                 . "      \"correct\": true,\n"
                 . "      \"explanation\": \"Why true/false\"\n"
                 . "    },\n"
                 . "    {\n"
                 . "      \"type\": \"matching\",\n"
                 . "      \"question\": \"Match the terms to their definitions\",\n"
                 . "      \"pairs\": [[\"Term1\", \"Definition1\"], [\"Term2\", \"Definition2\"], [\"Term3\", \"Definition3\"]],\n"
                 . "      \"explanation\": \"Key concepts explained\"\n"
                 . "    },\n"
                 . "    {\n"
                 . "      \"type\": \"ordering\",\n"
                 . "      \"question\": \"Put these items in the correct order\",\n"
                 . "      \"items\": [\"First\", \"Second\", \"Third\", \"Fourth\"],\n"
                 . "      \"explanation\": \"Why this order is correct\"\n"
                 . "    },\n"
                 . "    {\n"
                 . "      \"type\": \"scenario_judgment\",\n"
                 . "      \"scenario_context\": \"Describe a realistic situation the student might face\",\n"
                 . "      \"question\": \"What is the best course of action?\",\n"
                 . "      \"options\": [\"Best action\", \"Acceptable but not ideal\", \"Poor choice\", \"Worst choice\"],\n"
                 . "      \"correct\": 0,\n"
                 . "      \"explanation\": \"Why this is the best action and what could go wrong with other choices\"\n"
                 . "    }\n"
                 . "  ]\n"
                 . "}\n\n"
                 . "Use ONLY the question types appropriate for this scenario type. Do not include all types in every scenario.";

        $messages = array( array( 'role' => 'user', 'content' => 'Generate the scenario now.' ) );

        $result = Plato_LLM::chat( $messages, 'socratic', null, $system );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Parse JSON from LLM response.
        $content_str = $result['content'];
        // Strip markdown code fences if present.
        $content_str = preg_replace( '/^```(?:json)?\s*/', '', $content_str );
        $content_str = preg_replace( '/\s*```$/', '', $content_str );

        $generated = json_decode( $content_str, true );
        if ( ! $generated || ! isset( $generated['questions'] ) ) {
            return new WP_Error( 'plato_parse_failed', 'Failed to parse generated scenario.', array( 'status' => 500 ) );
        }

        // Save to database.
        $table = $wpdb->prefix . 'plato_scorm_scenarios';
        $wpdb->insert( $table, array(
            'user_id'    => $user_id,
            'package_id' => (int) $package->id,
            'type'       => $type,
            'content'    => wp_json_encode( $generated ),
            'status'     => 'pending',
            'created_at' => current_time( 'mysql', true ),
        ) );

        $scenario_id = (int) $wpdb->insert_id;

        return array(
            'id'         => $scenario_id,
            'package_id' => (int) $package->id,
            'type'       => $type,
            'title'      => $generated['title'] ?? $package->title . ' ' . ucfirst( str_replace( '_', ' ', $type ) ),
            'questions'  => $generated['questions'],
            'status'     => 'pending',
            'created_at' => current_time( 'mysql', true ),
        );
    }

    /**
     * Get scenarios for a package.
     */
    public static function get_scenarios( int $user_id, int $package_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_scenarios';

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d AND package_id = %d ORDER BY created_at DESC",
            $user_id,
            $package_id
        ) );

        $scenarios = array();
        foreach ( $rows as $row ) {
            $content = json_decode( $row->content, true ) ?: array();
            $scenarios[] = array(
                'id'           => (int) $row->id,
                'package_id'   => (int) $row->package_id,
                'type'         => $row->type,
                'title'        => $content['title'] ?? ucfirst( str_replace( '_', ' ', $row->type ) ),
                'questions'    => $content['questions'] ?? array(),
                'status'       => $row->status,
                'score'        => $row->score !== null ? (float) $row->score : null,
                'created_at'   => $row->created_at,
                'completed_at' => $row->completed_at,
            );
        }

        return $scenarios;
    }

    /**
     * Submit answers for a scenario.
     */
    public static function submit_scenario( int $scenario_id, int $user_id, array $answers ): array|WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_scorm_scenarios';

        $scenario = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d AND user_id = %d",
            $scenario_id,
            $user_id
        ) );

        if ( ! $scenario ) {
            return new WP_Error( 'plato_not_found', 'Scenario not found.', array( 'status' => 404 ) );
        }

        $content   = json_decode( $scenario->content, true ) ?: array();
        $questions = $content['questions'] ?? array();

        $total  = count( $questions );
        $scored = 0;
        $feedback = array();

        foreach ( $questions as $i => $q ) {
            $answer = $answers[ $i ] ?? null;
            $item   = array( 'question_index' => $i, 'type' => $q['type'] ?? 'mcq' );

            $qtype = $q['type'] ?? 'mcq';

            if ( $qtype === 'mcq' || $qtype === 'scenario_judgment' ) {
                $correct = $q['correct'] ?? 0;
                $is_correct = ( (int) $answer === (int) $correct );
                $item['correct'] = $is_correct;
                $item['correct_option'] = $correct;
                $item['chosen'] = $answer !== null ? (int) $answer : null;
                if ( $qtype === 'scenario_judgment' ) {
                    $item['scenario_context'] = $q['scenario_context'] ?? '';
                }
                if ( $is_correct ) {
                    $scored++;
                }
            } elseif ( $qtype === 'true_false' ) {
                $correct = (bool) ( $q['correct'] ?? true );
                $given   = $answer === 'true' || $answer === true || $answer === 1 || $answer === '1';
                $is_correct = ( $given === $correct );
                $item['correct'] = $is_correct;
                $item['correct_answer'] = $correct;
                $item['chosen'] = $given;
                if ( $is_correct ) {
                    $scored++;
                }
            } elseif ( $qtype === 'matching' ) {
                // Answer is array of indices mapping each term to a definition.
                // Correct order is 0,1,2,...  (pairs are in correct order in the question).
                $pairs = $q['pairs'] ?? array();
                $pair_count = count( $pairs );
                $correct_count = 0;
                $given_arr = is_array( $answer ) ? $answer : array();
                foreach ( $given_arr as $idx => $chosen_def ) {
                    if ( (int) $chosen_def === (int) $idx ) {
                        $correct_count++;
                    }
                }
                $ratio = $pair_count > 0 ? $correct_count / $pair_count : 0;
                $item['score'] = round( $ratio, 2 );
                $item['correct_count'] = $correct_count;
                $item['total_pairs'] = $pair_count;
                $item['chosen'] = $given_arr;
                $scored += $ratio;
            } elseif ( $qtype === 'ordering' ) {
                // Answer is array of indices representing student's order.
                // Correct order is 0,1,2,...
                $items = $q['items'] ?? array();
                $item_count = count( $items );
                $correct_count = 0;
                $given_arr = is_array( $answer ) ? $answer : array();
                foreach ( $given_arr as $pos => $chosen_idx ) {
                    if ( (int) $chosen_idx === (int) $pos ) {
                        $correct_count++;
                    }
                }
                $ratio = $item_count > 0 ? $correct_count / $item_count : 0;
                $item['score'] = round( $ratio, 2 );
                $item['correct_count'] = $correct_count;
                $item['total_items'] = $item_count;
                $item['chosen'] = $given_arr;
                $scored += $ratio;
            } else {
                // Short answer — basic keyword matching. Give partial credit.
                $sample = strtolower( $q['sample_answer'] ?? '' );
                $given  = strtolower( trim( (string) $answer ) );
                $keywords = array_filter( explode( ' ', $sample ), function ( $w ) { return strlen( $w ) > 3; } );
                $matches  = 0;
                foreach ( $keywords as $kw ) {
                    if ( stripos( $given, $kw ) !== false ) {
                        $matches++;
                    }
                }
                $ratio = count( $keywords ) > 0 ? $matches / count( $keywords ) : 0;
                $item['score'] = round( $ratio, 2 );
                $scored += $ratio;
            }

            $item['explanation'] = $q['explanation'] ?? '';
            $feedback[] = $item;
        }

        $score_pct = $total > 0 ? round( ( $scored / $total ) * 100, 1 ) : 0;

        // Update scenario.
        $wpdb->update( $table, array(
            'status'       => 'completed',
            'score'        => $score_pct,
            'completed_at' => current_time( 'mysql', true ),
        ), array( 'id' => $scenario_id ) );

        return array(
            'scenario_id' => $scenario_id,
            'score'       => $score_pct,
            'total'       => $total,
            'feedback'    => $feedback,
        );
    }

    /**
     * Get upcoming spaced review prompts.
     * Review intervals: 1 day, 3 days, 7 days, 14 days after completion.
     */
    public static function get_review_schedule( int $user_id ): array {
        global $wpdb;
        $pkg_table = $wpdb->prefix . 'plato_scorm_packages';
        $scn_table = $wpdb->prefix . 'plato_scorm_scenarios';

        // Get packages with completion data.
        $packages = $wpdb->get_results( $wpdb->prepare(
            "SELECT p.*,
                    (SELECT MAX(s.completed_at) FROM $scn_table s WHERE s.package_id = p.id AND s.user_id = %d AND s.type = 'quiz' AND s.status = 'completed') as last_quiz_at
             FROM $pkg_table p
             WHERE p.user_id = %d AND p.status = 'active'",
            $user_id,
            $user_id
        ) );

        $reviews = array();
        $intervals = array( 1, 3, 7, 14 ); // days

        foreach ( $packages as $pkg ) {
            if ( ! $pkg->last_quiz_at ) {
                continue;
            }

            $last_quiz = strtotime( $pkg->last_quiz_at );
            foreach ( $intervals as $days ) {
                $review_date = $last_quiz + ( $days * 86400 );
                if ( $review_date <= time() ) {
                    // Check if a review was already done on or after this date.
                    $review_done = $wpdb->get_var( $wpdb->prepare(
                        "SELECT COUNT(*) FROM $scn_table WHERE user_id = %d AND package_id = %d AND type = 'review' AND created_at >= %s",
                        $user_id,
                        (int) $pkg->id,
                        gmdate( 'Y-m-d H:i:s', $review_date )
                    ) );

                    if ( ! $review_done ) {
                        $reviews[] = array(
                            'package_id'    => (int) $pkg->id,
                            'package_title' => $pkg->title,
                            'review_type'   => $days . '-day review',
                            'due_date'      => gmdate( 'Y-m-d', $review_date ),
                            'days_overdue'  => (int) floor( ( time() - $review_date ) / 86400 ),
                        );
                        break; // Only show the earliest pending review per package.
                    }
                }
            }
        }

        return $reviews;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Parse an ISO 8601 duration or seconds string into total seconds.
     */
    private static function parse_duration( string $duration ): int {
        // Handle plain seconds
        if ( is_numeric( $duration ) ) {
            return (int) $duration;
        }

        // Handle PT format (e.g., PT1H30M15S)
        if ( preg_match( '/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/', $duration, $m ) ) {
            $hours   = isset( $m[1] ) ? (int) $m[1] : 0;
            $minutes = isset( $m[2] ) ? (int) $m[2] : 0;
            $seconds = isset( $m[3] ) ? (int) floatval( $m[3] ) : 0;
            return $hours * 3600 + $minutes * 60 + $seconds;
        }

        return 0;
    }

    /**
     * Format seconds into a human-readable string.
     */
    private static function format_duration( int $seconds ): string {
        if ( $seconds < 60 ) {
            return $seconds . 's';
        }
        $minutes = floor( $seconds / 60 );
        $secs    = $seconds % 60;
        if ( $minutes < 60 ) {
            return $minutes . 'm ' . $secs . 's';
        }
        $hours = floor( $minutes / 60 );
        $mins  = $minutes % 60;
        return $hours . 'h ' . $mins . 'm';
    }
}
