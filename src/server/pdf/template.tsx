import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { RiskItem, LLMAnalysis, ScoreBreakdown, RiskBand, RoundType } from '@/types';
import { formatHoursMinutes } from '@/lib/format';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#18181b',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
  },
  scoreSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  riskBandHigh: {
    color: '#dc2626',
  },
  riskBandMedium: {
    color: '#d97706',
  },
  riskBandLow: {
    color: '#16a34a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#18181b',
  },
  riskItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  riskNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e4e4e7',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskNumberText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  severityCritical: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
  severityHigh: {
    backgroundColor: '#fecaca',
    color: '#991b1b',
  },
  severityMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  severityLow: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  riskTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  riskRationale: {
    fontSize: 9,
    color: '#52525b',
    marginTop: 4,
  },
  riskEvidence: {
    fontSize: 9,
    color: '#71717a',
    marginTop: 6,
    fontStyle: 'italic',
  },
  questionItem: {
    marginBottom: 10,
    paddingLeft: 15,
  },
  questionText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  questionWhy: {
    fontSize: 9,
    color: '#71717a',
  },
  studyItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  studyCheckbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    marginRight: 10,
    marginTop: 2,
  },
  studyTask: {
    flex: 1,
    fontSize: 10,
  },
  studyTime: {
    fontSize: 9,
    color: '#71717a',
    width: 50,
    textAlign: 'right',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  breakdownLabel: {
    fontSize: 10,
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#a1a1aa',
  },
});

interface DiagnosticPDFProps {
  reportId: string;
  roundType: RoundType;
  readinessScore: number;
  riskBand: RiskBand;
  risks: RiskItem[];
  interviewQuestions: LLMAnalysis['interviewQuestions'];
  studyPlan: LLMAnalysis['studyPlan'];
  scoreBreakdown: ScoreBreakdown;
  generatedAt: string;
}

export function DiagnosticPDF({
  roundType,
  readinessScore,
  riskBand,
  risks,
  interviewQuestions,
  studyPlan,
  scoreBreakdown,
  generatedAt,
}: DiagnosticPDFProps) {
  const getRiskBandStyle = () => {
    switch (riskBand) {
      case 'High':
        return styles.riskBandHigh;
      case 'Medium':
        return styles.riskBandMedium;
      case 'Low':
        return styles.riskBandLow;
      default:
        return {};
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return styles.severityCritical;
      case 'high':
        return styles.severityHigh;
      case 'medium':
        return styles.severityMedium;
      case 'low':
        return styles.severityLow;
      default:
        return {};
    }
  };

  const totalStudyMinutes = studyPlan.reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const totalStudyHoursFormatted = formatHoursMinutes(totalStudyMinutes / 60);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>InterviewProof Diagnostic</Text>
          <Text style={styles.subtitle}>
            {roundType.charAt(0).toUpperCase() + roundType.slice(1)} Interview Analysis
          </Text>
          <Text style={[styles.subtitle, { marginTop: 5 }]}>Generated: {generatedAt}</Text>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Readiness Score</Text>
          <Text style={[styles.scoreValue, getRiskBandStyle()]}>{readinessScore} / 100</Text>
          <Text style={[{ fontSize: 12, marginTop: 5 }, getRiskBandStyle()]}>{riskBand} Risk</Text>
        </View>

        {/* Score Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Hard Requirements ({Math.round(scoreBreakdown.weights.hardRequirementMatch * 100)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              {Math.round(scoreBreakdown.hardRequirementMatch)} / 100
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Evidence Depth ({Math.round(scoreBreakdown.weights.evidenceDepth * 100)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              {Math.round(scoreBreakdown.evidenceDepth)} / 100
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Round Readiness ({Math.round(scoreBreakdown.weights.roundReadiness * 100)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              {Math.round(scoreBreakdown.roundReadiness)} / 100
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Resume Clarity ({Math.round(scoreBreakdown.weights.resumeClarity * 100)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              {Math.round(scoreBreakdown.resumeClarity)} / 100
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Company Fit ({Math.round(scoreBreakdown.weights.companyProxy * 100)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              {Math.round(scoreBreakdown.companyProxy)} / 100
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          InterviewProof - Know What Will Sink You | interviewproof.com
        </Text>
      </Page>

      {/* Risks Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rejection Risks ({risks.length})</Text>
          {risks.map((risk, index) => (
            <View key={risk.id} style={styles.riskItem}>
              <View style={styles.riskHeader}>
                <View style={styles.riskNumber}>
                  <Text style={styles.riskNumberText}>{index + 1}</Text>
                </View>
                <View style={[styles.severityBadge, getSeverityStyle(risk.severity)]}>
                  <Text style={{ fontSize: 8 }}>{risk.severity.toUpperCase()}</Text>
                </View>
                <Text style={styles.riskTitle}>{risk.title}</Text>
              </View>
              <Text style={styles.riskRationale}>{risk.rationale}</Text>
              {risk.missingEvidence && (
                <Text style={styles.riskEvidence}>Missing: {risk.missingEvidence}</Text>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          InterviewProof - Know What Will Sink You | interviewproof.com
        </Text>
      </Page>

      {/* Questions & Study Plan Page */}
      <Page size="A4" style={styles.page}>
        {/* Interview Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Interview Questions to Expect ({interviewQuestions.length})
          </Text>
          {interviewQuestions.map((q, index) => (
            <View key={index} style={styles.questionItem}>
              <Text style={styles.questionText}>
                {index + 1}. {q.question}
              </Text>
              <Text style={styles.questionWhy}>{q.why}</Text>
            </View>
          ))}
        </View>

        {/* Study Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Plan (~{totalStudyHoursFormatted})</Text>
          {studyPlan.map((task, index) => (
            <View key={index} style={styles.studyItem}>
              <View style={styles.studyCheckbox} />
              <Text style={styles.studyTask}>{task.task}</Text>
              <Text style={styles.studyTime}>{task.timeEstimateMinutes} min</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          InterviewProof - Know What Will Sink You | interviewproof.com
        </Text>
      </Page>
    </Document>
  );
}
