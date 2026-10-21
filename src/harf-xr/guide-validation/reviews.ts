import type {PracticeId} from '../../integration/practice';
import type {Rules} from './engine';

// Approval of the proposal does not provide the missing geometric annotations.
// Populate a letter only with reviewed source-coordinate paths/regions and
// accepted/rejected regression fixtures. No URL or local-storage override.
export const REVIEWED_GUIDES:Readonly<Record<PracticeId,Rules|null>>={
 kaf:null,lam:null,fa:null,ya:null,
};
