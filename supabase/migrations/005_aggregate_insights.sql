-- Aggregate insights function for the Interview Intelligence stats section.
-- Returns cross-user aggregate data. Uses SECURITY DEFINER to bypass RLS.

CREATE OR REPLACE FUNCTION get_aggregate_insights()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalAnalyses', (SELECT COUNT(*) FROM runs),
    'avgReadinessScore', (SELECT COALESCE(ROUND(AVG(readiness_score)), 0) FROM runs),
    'riskBandDistribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          risk_band::text AS band,
          COUNT(*) AS count,
          ROUND(COUNT(*) * 100.0 / GREATEST(1, (SELECT COUNT(*) FROM runs)), 1) AS percentage
        FROM runs
        GROUP BY risk_band
        ORDER BY
          CASE risk_band
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
          END
      ) t
    ),
    'roundTypeDistribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          r.round_type::text AS "roundType",
          COUNT(*) AS count,
          ROUND(COUNT(*) * 100.0 / GREATEST(1, (SELECT COUNT(*) FROM runs)), 1) AS percentage
        FROM runs ru
        JOIN reports r ON r.id = ru.report_id
        GROUP BY r.round_type
        ORDER BY count DESC
      ) t
    ),
    'avgScoreByRound', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          r.round_type::text AS "roundType",
          ROUND(AVG(ru.readiness_score)) AS "avgScore"
        FROM runs ru
        JOIN reports r ON r.id = ru.report_id
        GROUP BY r.round_type
        ORDER BY r.round_type
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
