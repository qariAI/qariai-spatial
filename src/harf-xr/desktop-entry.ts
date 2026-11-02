import {requestedPractice} from '../integration/routes';
// Do not initialize the Bāʾ validator or its handlers in ungraded Orbit-letter modes.
if(requestedPractice(location.search))void import('./free-practice');
else void import('./desktop');
