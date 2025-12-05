'use client';
import styles from './ProgressSteps.module.css';

interface Step {
  number: number;
  label: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function ProgressSteps({ steps, currentStep, className = '' }: ProgressStepsProps) {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`${styles.progressContainer} ${className}`}>
      <div className={styles.progressSteps}>
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`${styles.step} ${
              step.number === currentStep
                ? styles.active
                : step.number < currentStep
                ? styles.completed
                : ''
            }`}
          >
            <div className={styles.stepIndicator}>
              <div className={styles.stepNumber}>
                {step.number < currentStep ? '✓' : step.number}
              </div>
            </div>
            <div className={styles.stepLabel}>{step.label}</div>
          </div>
        ))}
      </div>
      
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}