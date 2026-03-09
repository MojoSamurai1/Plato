<?php
/**
 * Plato_Diagnostics
 *
 * Evidence-based learning diagnostics: question bank, scoring, shadow signals, AI context.
 * Based on MSLQ, MAI, Biggs R-SPQ-2F, Bandura GSE, and SDT motivation scales.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Diagnostics {

    const QUESTION_BANK_VERSION = 1;

    const DIMENSIONS = array(
        'self_efficacy' => array(
            'label'          => 'Domain Self-Efficacy',
            'description'    => 'Your confidence in tackling academic tasks, handling challenges, and recovering from setbacks.',
            'sub_dimensions' => array( 'task_confidence', 'challenge_response', 'recovery' ),
        ),
        'self_regulation' => array(
            'label'          => 'Self-Regulation & Study Strategies',
            'description'    => 'How you plan, manage time, seek help, persist through difficulty, and monitor your own learning.',
            'sub_dimensions' => array( 'planning', 'time_management', 'help_seeking', 'persistence', 'self_monitoring' ),
        ),
        'learning_approach' => array(
            'label'          => 'Learning Approach',
            'description'    => 'Whether you tend toward deep understanding or surface memorisation, and your pacing and social preferences.',
            'sub_dimensions' => array( 'deep_vs_surface', 'pacing', 'social_preference', 'challenge_level' ),
        ),
        'metacognitive' => array(
            'label'          => 'Metacognitive Awareness',
            'description'    => 'Your ability to monitor your own thinking — knowing what you know, spotting gaps, and transferring knowledge.',
            'sub_dimensions' => array( 'understanding_awareness', 'gap_identification', 'comprehension_monitoring', 'transfer' ),
        ),
        'confidence' => array(
            'label'          => 'Academic Confidence & Anxiety',
            'description'    => 'Your level of test anxiety, subject confidence, and how you respond to feedback.',
            'sub_dimensions' => array( 'test_anxiety', 'subject_confidence', 'feedback_response' ),
        ),
    );

    /**
     * Question bank — 24 questions across 5 dimensions.
     * Each question: id, text, dimension, sub_dimension, reverse_scored.
     */
    public static function get_questions(): array {
        return array(
            // ─── Self-Efficacy (5 questions) ─────────────────────────────
            array( 'id' => 'se1', 'text' => 'I believe I can understand even the most complex material in my courses if I put in enough effort.', 'dimension' => 'self_efficacy', 'sub_dimension' => 'task_confidence', 'reverse_scored' => false ),
            array( 'id' => 'se2', 'text' => 'When I face a difficult assignment, I feel confident I can figure it out.', 'dimension' => 'self_efficacy', 'sub_dimension' => 'task_confidence', 'reverse_scored' => false ),
            array( 'id' => 'se3', 'text' => 'I tend to give up quickly when course content gets hard.', 'dimension' => 'self_efficacy', 'sub_dimension' => 'challenge_response', 'reverse_scored' => true ),
            array( 'id' => 'se4', 'text' => 'After getting a poor grade, I can usually bounce back and improve.', 'dimension' => 'self_efficacy', 'sub_dimension' => 'recovery', 'reverse_scored' => false ),
            array( 'id' => 'se5', 'text' => 'I often doubt my ability to perform well in my courses.', 'dimension' => 'self_efficacy', 'sub_dimension' => 'task_confidence', 'reverse_scored' => true ),

            // ─── Self-Regulation (6 questions) ──────────────────────────
            array( 'id' => 'sr1', 'text' => 'Before starting an assignment, I plan out the steps I need to take.', 'dimension' => 'self_regulation', 'sub_dimension' => 'planning', 'reverse_scored' => false ),
            array( 'id' => 'sr2', 'text' => 'I set aside regular blocks of time for studying each week.', 'dimension' => 'self_regulation', 'sub_dimension' => 'time_management', 'reverse_scored' => false ),
            array( 'id' => 'sr3', 'text' => 'When I don\'t understand something, I ask for help from classmates or tutors.', 'dimension' => 'self_regulation', 'sub_dimension' => 'help_seeking', 'reverse_scored' => false ),
            array( 'id' => 'sr4', 'text' => 'I often procrastinate on assignments until the last minute.', 'dimension' => 'self_regulation', 'sub_dimension' => 'time_management', 'reverse_scored' => true ),
            array( 'id' => 'sr5', 'text' => 'Even when a topic bores me, I keep studying until I understand it.', 'dimension' => 'self_regulation', 'sub_dimension' => 'persistence', 'reverse_scored' => false ),
            array( 'id' => 'sr6', 'text' => 'I regularly review my progress to check if my study approach is working.', 'dimension' => 'self_regulation', 'sub_dimension' => 'self_monitoring', 'reverse_scored' => false ),

            // ─── Learning Approach (5 questions) ────────────────────────
            array( 'id' => 'la1', 'text' => 'I try to understand the reasoning behind ideas, not just memorise facts.', 'dimension' => 'learning_approach', 'sub_dimension' => 'deep_vs_surface', 'reverse_scored' => false ),
            array( 'id' => 'la2', 'text' => 'I prefer to study one topic in depth rather than skimming many topics quickly.', 'dimension' => 'learning_approach', 'sub_dimension' => 'pacing', 'reverse_scored' => false ),
            array( 'id' => 'la3', 'text' => 'I learn better when I can discuss ideas with other people.', 'dimension' => 'learning_approach', 'sub_dimension' => 'social_preference', 'reverse_scored' => false ),
            array( 'id' => 'la4', 'text' => 'I enjoy assignments that challenge me beyond what was covered in class.', 'dimension' => 'learning_approach', 'sub_dimension' => 'challenge_level', 'reverse_scored' => false ),
            array( 'id' => 'la5', 'text' => 'I mostly just try to memorise key facts for the exam without going deeper.', 'dimension' => 'learning_approach', 'sub_dimension' => 'deep_vs_surface', 'reverse_scored' => true ),

            // ─── Metacognitive Awareness (5 questions) ──────────────────
            array( 'id' => 'ma1', 'text' => 'I can usually tell when I truly understand a concept versus just recognising it.', 'dimension' => 'metacognitive', 'sub_dimension' => 'understanding_awareness', 'reverse_scored' => false ),
            array( 'id' => 'ma2', 'text' => 'When studying, I can identify which areas I need to spend more time on.', 'dimension' => 'metacognitive', 'sub_dimension' => 'gap_identification', 'reverse_scored' => false ),
            array( 'id' => 'ma3', 'text' => 'While reading, I stop to check whether I actually understand what I just read.', 'dimension' => 'metacognitive', 'sub_dimension' => 'comprehension_monitoring', 'reverse_scored' => false ),
            array( 'id' => 'ma4', 'text' => 'I can apply what I learn in one course to problems in a different course.', 'dimension' => 'metacognitive', 'sub_dimension' => 'transfer', 'reverse_scored' => false ),
            array( 'id' => 'ma5', 'text' => 'I often finish reading a page and realise I have no idea what it said.', 'dimension' => 'metacognitive', 'sub_dimension' => 'comprehension_monitoring', 'reverse_scored' => true ),

            // ─── Academic Confidence & Anxiety (3 questions) ─────────────
            array( 'id' => 'ca1', 'text' => 'I feel anxious when I think about upcoming exams or assessments.', 'dimension' => 'confidence', 'sub_dimension' => 'test_anxiety', 'reverse_scored' => false ),
            array( 'id' => 'ca2', 'text' => 'I feel confident in my knowledge of the subjects I am studying.', 'dimension' => 'confidence', 'sub_dimension' => 'subject_confidence', 'reverse_scored' => false ),
            array( 'id' => 'ca3', 'text' => 'When I receive critical feedback, I use it to improve rather than feeling defeated.', 'dimension' => 'confidence', 'sub_dimension' => 'feedback_response', 'reverse_scored' => false ),
        );
    }

    /**
     * Score a set of answers.
     *
     * @param array $answers Associative array { question_id => 1-5 }.
     * @return array Structured scoring result.
     */
    public static function score( array $answers ): array {
        $questions = self::get_questions();
        $by_dimension    = array();
        $by_sub          = array();

        foreach ( $questions as $q ) {
            $qid   = $q['id'];
            $value = isset( $answers[ $qid ] ) ? intval( $answers[ $qid ] ) : null;
            if ( $value === null || $value < 1 || $value > 5 ) {
                continue;
            }

            // Reverse scoring: 1↔5, 2↔4, 3 stays.
            if ( $q['reverse_scored'] ) {
                $value = 6 - $value;
            }

            $dim = $q['dimension'];
            $sub = $q['sub_dimension'];

            if ( ! isset( $by_dimension[ $dim ] ) ) {
                $by_dimension[ $dim ] = array();
            }
            $by_dimension[ $dim ][] = $value;

            $key = $dim . '.' . $sub;
            if ( ! isset( $by_sub[ $key ] ) ) {
                $by_sub[ $key ] = array();
            }
            $by_sub[ $key ][] = $value;
        }

        // Average per dimension.
        $dimension_scores = array();
        foreach ( $by_dimension as $dim => $values ) {
            $dimension_scores[ $dim ] = round( array_sum( $values ) / count( $values ), 2 );
        }

        // Average per sub-dimension.
        $sub_scores = array();
        foreach ( $by_sub as $key => $values ) {
            $sub_scores[ $key ] = round( array_sum( $values ) / count( $values ), 2 );
        }

        return array(
            'dimension_scores' => $dimension_scores,
            'sub_scores'       => $sub_scores,
            'version'          => self::QUESTION_BANK_VERSION,
        );
    }

    /**
     * Get the latest diagnostics profile for a user.
     */
    public static function get_latest_profile( int $user_id ): ?object {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_diagnostics_results';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY completed_at DESC LIMIT 1",
            $user_id
        ) );
    }

    /**
     * Get all past diagnostics results for a user (for history/progress view).
     */
    public static function get_history( int $user_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_diagnostics_results';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY completed_at DESC",
            $user_id
        ) );
    }

    /**
     * Save a diagnostics result.
     */
    public static function save_result( int $user_id, array $scored, array $raw_answers ): int|false {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_diagnostics_results';

        $dim = $scored['dimension_scores'];

        $result = $wpdb->insert( $table, array(
            'user_id'              => $user_id,
            'version'              => self::QUESTION_BANK_VERSION,
            'self_efficacy_score'  => $dim['self_efficacy'] ?? 0,
            'self_regulation_score' => $dim['self_regulation'] ?? 0,
            'learning_approach_score' => $dim['learning_approach'] ?? 0,
            'metacognitive_score'  => $dim['metacognitive'] ?? 0,
            'confidence_score'     => $dim['confidence'] ?? 0,
            'raw_answers'          => wp_json_encode( $raw_answers ),
            'dimension_detail'     => wp_json_encode( $scored['sub_scores'] ),
            'completed_at'         => current_time( 'mysql', true ),
        ) );

        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    /**
     * Get or initialize learner signals row.
     */
    public static function get_learner_signals( int $user_id ): ?object {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_learner_signals';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ) );
    }

    /**
     * Update learner signals (upsert).
     */
    public static function update_learner_signals( int $user_id, array $data ): void {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_learner_signals';

        $existing = self::get_learner_signals( $user_id );

        $data['updated_at'] = current_time( 'mysql', true );

        if ( $existing ) {
            $wpdb->update( $table, $data, array( 'user_id' => $user_id ) );
        } else {
            $data['user_id'] = $user_id;
            $wpdb->insert( $table, $data );
        }
    }

    /**
     * Describe a score numerically as prose.
     */
    public static function describe_score( float $score ): string {
        if ( $score < 2.0 ) {
            return 'needs development';
        }
        if ( $score < 3.0 ) {
            return 'developing';
        }
        if ( $score < 4.0 ) {
            return 'competent';
        }
        return 'strong';
    }

    /**
     * Build AI context string from both self-report and shadow signals.
     */
    public static function get_ai_context( int $user_id ): ?string {
        $profile = self::get_latest_profile( $user_id );
        $signals = self::get_learner_signals( $user_id );

        if ( ! $profile && ! $signals ) {
            return null;
        }

        $context = '';

        if ( $profile ) {
            $detail = json_decode( $profile->dimension_detail, true ) ?: array();

            $context .= "LEARNER PROFILE (from self-assessment):\n";
            $context .= sprintf( "- Self-Efficacy: %s/5 (%s)\n", $profile->self_efficacy_score, self::describe_score( (float) $profile->self_efficacy_score ) );
            $context .= sprintf( "- Self-Regulation: %s/5 (%s)\n", $profile->self_regulation_score, self::describe_score( (float) $profile->self_regulation_score ) );
            $context .= sprintf( "- Learning Approach: %s/5 (%s)\n", $profile->learning_approach_score, self::describe_score( (float) $profile->learning_approach_score ) );
            $context .= sprintf( "- Metacognitive Awareness: %s/5 (%s)\n", $profile->metacognitive_score, self::describe_score( (float) $profile->metacognitive_score ) );
            $context .= sprintf( "- Academic Confidence: %s/5 (%s)\n", $profile->confidence_score, self::describe_score( (float) $profile->confidence_score ) );

            // Sub-dimension highlights.
            if ( ! empty( $detail ) ) {
                $help_seeking = $detail['self_regulation.help_seeking'] ?? null;
                $test_anxiety = $detail['confidence.test_anxiety'] ?? null;
                $deep_surface = $detail['learning_approach.deep_vs_surface'] ?? null;
                $pacing       = $detail['learning_approach.pacing'] ?? null;

                $prefs = array();
                if ( $deep_surface !== null ) {
                    $prefs[] = $deep_surface >= 3.5 ? 'deep-dive learner' : 'surface learner — needs depth encouragement';
                }
                if ( $pacing !== null ) {
                    $prefs[] = $pacing >= 3.5 ? 'prefers depth over breadth' : 'prefers breadth over depth';
                }
                if ( ! empty( $prefs ) ) {
                    $context .= "- Learning Preferences: " . implode( ', ', $prefs ) . "\n";
                }
                if ( $help_seeking !== null ) {
                    $context .= sprintf( "- Help-Seeking: %s/5 (%s)\n", $help_seeking, $help_seeking < 3 ? 'rarely asks for help' : 'proactive help-seeker' );
                }
                if ( $test_anxiety !== null ) {
                    $context .= sprintf( "- Test Anxiety: %s/5\n", $test_anxiety );
                }
            }
        }

        if ( $signals ) {
            $context .= "\nBEHAVIORAL SIGNALS (from interaction data):\n";

            if ( $signals->calibration_gap !== null ) {
                $gap = (float) $signals->calibration_gap;
                $cal_desc = $gap > 0.5 ? 'overconfident — self-rates higher than actual performance' :
                           ( $gap < -0.5 ? 'underconfident — performs better than self-rating' : 'well-calibrated' );
                $context .= sprintf( "- Calibration gap: %+.1f (%s)\n", $gap, $cal_desc );
            }

            if ( $signals->help_seeking_rate !== null ) {
                $hs = (float) $signals->help_seeking_rate;
                $context .= sprintf( "- Help-seeking rate: %.0f%% (%s)\n", $hs * 100, $hs < 0.1 ? 'Low — rarely asks for help' : ( $hs > 0.5 ? 'High — frequently seeks help' : 'Moderate' ) );
            }

            if ( $signals->session_consistency !== null ) {
                $sc = (float) $signals->session_consistency;
                $context .= sprintf( "- Session consistency: %s\n", $sc >= 0.7 ? 'High (regular study pattern)' : ( $sc >= 0.4 ? 'Moderate' : 'Low (irregular study pattern)' ) );
            }

            if ( $signals->wheel_spin_count !== null && (int) $signals->wheel_spin_count > 0 ) {
                $context .= sprintf( "- Wheel-spinning detected: %d times\n", $signals->wheel_spin_count );
            }
        }

        // Adaptation instructions.
        $context .= "\nAdapt your tutoring based on this profile:\n";
        if ( $profile ) {
            if ( (float) $profile->self_efficacy_score < 3.0 ) {
                $context .= "- Low self-efficacy: Be encouraging, break tasks into smaller steps, celebrate small wins\n";
            }
            if ( (float) $profile->metacognitive_score < 3.0 ) {
                $context .= "- Low metacognition: Model thinking strategies explicitly, ask \"what do you already know about this?\"\n";
            }
            if ( isset( $detail['confidence.test_anxiety'] ) && (float) $detail['confidence.test_anxiety'] > 3.0 ) {
                $context .= "- High test anxiety: Be reassuring, use low-pressure language, frame mistakes as learning\n";
            }
        }
        if ( $signals && $signals->calibration_gap !== null && (float) $signals->calibration_gap > 0.5 ) {
            $context .= "- Overconfident calibration: Surface misconceptions before advancing, use 'are you sure?' prompts\n";
        }
        if ( $signals && $signals->help_seeking_rate !== null && (float) $signals->help_seeking_rate < 0.1 ) {
            $context .= "- Low help-seeking: Proactively offer hints and check understanding\n";
        }

        return trim( $context );
    }

    /**
     * Format a profile result for API response.
     */
    public static function format_profile( object $profile ): array {
        $stale = false;

        // Check if stale (>90 days old or version mismatch).
        $completed = strtotime( $profile->completed_at );
        if ( $completed && ( time() - $completed ) > 90 * 86400 ) {
            $stale = true;
        }
        if ( (int) $profile->version !== self::QUESTION_BANK_VERSION ) {
            $stale = true;
        }

        return array(
            'id'                 => (int) $profile->id,
            'version'            => (int) $profile->version,
            'self_efficacy'      => (float) $profile->self_efficacy_score,
            'self_regulation'    => (float) $profile->self_regulation_score,
            'learning_approach'  => (float) $profile->learning_approach_score,
            'metacognitive'      => (float) $profile->metacognitive_score,
            'confidence'         => (float) $profile->confidence_score,
            'dimension_detail'   => json_decode( $profile->dimension_detail, true ) ?: array(),
            'completed_at'       => $profile->completed_at,
            'stale'              => $stale,
            'dimensions'         => self::DIMENSIONS,
        );
    }
}
