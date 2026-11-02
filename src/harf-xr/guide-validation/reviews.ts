import type {PracticeId} from '../../integration/practice';
import type {Rules} from './engine';
import approved from './approved-guides.json';

// Owner explicitly attested qualified review and real-handwriting testing.
// See the review reference for evidence and its limits. No URL/storage override.
export const REVIEWED_GUIDES:Readonly<Record<PracticeId,Rules|null>>=approved as unknown as Record<PracticeId,Rules>;
