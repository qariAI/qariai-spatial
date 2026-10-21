import {requestedPractice} from '../integration/routes';
// Do not initialize the Bāʾ validator or its handlers in ungraded kāf mode.
if(requestedPractice(location.search)==='kaf')void import('./kaf-practice');
else void import('./desktop');
