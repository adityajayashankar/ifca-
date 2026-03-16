const catchupController = require('./api/catchup/catchup.controller');

console.log('Testing catchup controller exports...');

const requiredFunctions = [
    'createCatchUp',
    'verifyCommunityMember', 
    'verifyCommunityHavingCatchup',
    'getCatchupByCommunity',
    'leaveCatchup',
    'returnRoomId',
    'verifyLeader',
    'getUserActiveCatchups',
    'createScheduledCatchUp',
    'getScheduledCatchups',
    'startScheduledCatchUp',
    'updateCatchupRoom',
    'createTestLiveCatchup',
    'debugCatchupState',
    'joinCatchUp',
    'leaveCatchUp',
    'getCatchupAttendees',
    'joinCatchupOnEnter',
    'getCatchupStatus'
];

let allFunctionsPresent = true;

requiredFunctions.forEach(funcName => {
    if (typeof catchupController[funcName] === 'function') {
        console.log(`✅ ${funcName} - OK`);
    } else {
        console.log(`❌ ${funcName} - MISSING`);
        allFunctionsPresent = false;
    }
});

if (allFunctionsPresent) {
    console.log('\n🎉 All functions are properly exported!');
} else {
    console.log('\n❌ Some functions are missing from exports');
}
