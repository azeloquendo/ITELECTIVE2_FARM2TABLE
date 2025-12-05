'use client';
import { FarmDescriptionProps } from '../../../interface/seller/profile';
import styles from './FarmDescription.module.css';

export default function FarmDescription({ description, viewerRole = 'seller' }: FarmDescriptionProps) {
  return (
    <div className={styles.card}>
      <div className={styles.description}>
        {description.split('\n').map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

