const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
// const rateLimit = require('express-rate-limit');

const serviceAccount = require('./serviceAccountForMillionair.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://millionair-cb16a-default-rtdb.firebaseio.com/',
});

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
// });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
// app.use('/update-settings', limiter);
// Set up the listener for Settings/SiteSetting/mst
const SiteSettingRef = admin.database().ref('Settings/SiteSetting');

// Initial value for COUNTDOWN_DURATION (default)
let countdownTimeouts = []
let refs = []
let DRAW_TIMEOUT = null;
let SERVICE_FEE = null;
let PENALITY_FEE = null;
let DRAW_REF = null;
let DRAW_STARTED_AT = null;
let COUNTDOWN_DURATION = null;
let WIN_AMOUNT = null;
let SERVER_URL = null;
let PreDailContribution = null;
let PostDailyContribution = null;
let DRAW_STARTED = false;
let NUMBER_OF_DRAWS = null;
let currentListenerPath = null;
let currentWinnersListener = null;

app.post('/update-settings', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing.' });
    }

    const updatedSettings = req.body;

    await updateSiteSettings(updatedSettings);

    res.status(200).json({ success: true, message: 'Site settings updated successfully.' });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/start-draw', async (req, res) => {
  try {
    const { drawStarted } = req.body;

    if (typeof drawStarted !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid startDraw value.' });
    }
    await updateSiteSettings({ drawStarted: drawStarted });
    var message = "Draw Ended Successfully."
    if (drawStarted) {
        message = 'Draw started successfully.' 
    }
    res.status(200).json({ success: true, message: message});
  } catch (error) {
    console.error('Error starting draw:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/update-deposit', async (req, res) => {
    try {
      const { amount, selectedMember, formattedDate } = req.body;
  
      if (!selectedMember || !formattedDate|| !amount) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
      }
  
      await updateDeposit(amount, selectedMember, formattedDate);
  
      res.status(200).json({ success: true, message: 'Deposit updated successfully.' });
    } catch (error) {
      console.error('Error updating deposit:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/set-winner', async (req, res) => {
    try {
      const { winnerMember, drawPath, drawnBy } = req.body;
  
      if (!winnerMember || !drawPath || !drawnBy) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
      }
      await setWinner(winnerMember, drawPath, drawnBy);
  
      res.status(200).json({ success: true, message: 'Winner is set successfully.' });
    } catch (error) {
      console.error('Error setting winner:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.get('/fetch-winners', async (req, res) => {
    const { path } = req.query;
  
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
  
    try {
      const snapshot = await admin.database().ref(path).once('value');
      const data = snapshot.val();
      console.log(data);
  
      if (data) {
        res.json(data);
      } else {
        return res.status(404).json({ error: 'Data not found for the specified path' });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/stop-spinner', async (req, res) => {
    try {
    const { drawPath } = req.body;
    if (!drawPath) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }

    await stopSpinner(drawPath);

    res.status(200).json({ success: true, message: 'Spinner stopped successfully.' });
    } catch (error) {
    console.error('Error stoping spinner:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/update-lotto-setting', async (req, res) => {
    const { 
        winner,
        penalityAmount,
        amount, 
        selectedMember, 
        currentUser, 
        lastDate, 
        totalLottoTogenerate, 
        depositingRollNumber,
        currentRollNumber, 
        dailyContribution  } = req.body;
    if (
        winner == null ||
        penalityAmount == null || 
        amount == null || 
        selectedMember  == null || 
        currentUser  == null || 
        totalLottoTogenerate  == null || 
        depositingRollNumber == null  ||
        currentRollNumber  == null || 
        dailyContribution == null ) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }
    var formattedDate = null
    var firstTime = true
    var daysDifference = 0;
    var depoRollNumber = depositingRollNumber;
    var currRollNumber = currentRollNumber;
    if (lastDate != null) {
        daysDifference = daysAheadOfToday(lastDate); 
        firstTime = false 
    }
    for (let index = 0; index < totalLottoTogenerate; index++) {
        depoRollNumber = depoRollNumber + 1
        currRollNumber = currRollNumber + 1 
        if (daysDifference != 0) {
            formattedDate = formatDateNow(index + daysDifference + 1);
        } else {
            formattedDate = formatDateNow(index + daysDifference);                                    
        }
        if (winner) {
            await updateLastDate(firstTime,selectedMember.id, formattedDate);
            await updateServiceFee(selectedMember.id, formattedDate, SERVICE_FEE, selectedMember.pot);
            if (penalityAmount != 0) {
                await updatePenalityFee(selectedMember.id, formattedDate, PENALITY_FEE, penalityAmount, selectedMember.pot);                
            }
            
        } else {
            const lottoNumber  = currRollNumber.toString().padStart(9, '0'); 
            await updateRollAndLottoNumber(firstTime,currRollNumber,lottoNumber, selectedMember.pot, formattedDate, amount, dailyContribution, selectedMember, currentUser)
        }
        updateDailyContribution(selectedMember.id,formattedDate,dailyContribution,selectedMember.pot)
    }
    await updateDeposit(amount, selectedMember.id, formatDateNow(0))
  if (winner) {
    
    res.status(200).json({ success: true, message: `${totalLottoTogenerate} days of payment covered for: ${selectedMember.name}` });
   
  } else {
    
    res.status(200).json({ success: true, message: `${totalLottoTogenerate} lotto numbers successfully generated for: ${selectedMember.name}` });
   
  } // this.setSnackbarMessage(`${totalLottoTogenerate} lotto numbers successfully generated for ${this.selectedMember.name}`)
    
    
});
async function updateRollAndLottoNumber(firstTime, newRollNumber, newCurrentLottoNumber, potNumber, formattedDate, amount, dailyContribution, selectedMember, currentUser) {
    try {
        // Step 1: Get a reference to the LottoSettings path in the database
        const lottoSettingsRef = admin.database().ref(`Settings/LottoSetting/${potNumber}`);

        // Step 2: Update both rollNumber and currentLottoNumber atomically using a transaction
        const transactionResult = await lottoSettingsRef.transaction(() => {
            return {
                rollNumber: newRollNumber,
                currentLottoNumber: newCurrentLottoNumber,
                updatedAt: Date.now()
            };
        });

        // Check if the transaction was successful
        if (!transactionResult.committed) {
            this.setSnackbarMessage('Transaction was aborted.');
            return;
        }

        console.log('Roll number and current lotto number updated successfully!');

    const lottoNumberRef = admin.database().ref(`LottoNumber/${potNumber}/${formattedDate}/${transactionResult.snapshot.val().rollNumber}`);

    await lottoNumberRef.set({
        id: transactionResult.snapshot.val().rollNumber,
        rollNumber: transactionResult.snapshot.val().rollNumber,
        amount: amount,
        dailyContribution: dailyContribution,
        currentLottoNumber: transactionResult.snapshot.val().currentLottoNumber,
        depositedBy: currentUser.email,
        depositedAt: Date.now(),
        depositedFor: selectedMember.id,
    },async ()=>{
        await updateLastDate(firstTime, selectedMember.id, formattedDate);
    } )
    } catch (error) {
        console.error('Error updating roll and lotto numbers:', error);
    }
}
  function formatDateNow(days) {
    // Get the current date
    const currentDate = new Date();
    // Increment the date 
    currentDate.setDate(currentDate.getDate() + days);

    // Define months array
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Get day, month, and year
    const day = currentDate.getDate();
    const monthIndex = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Format the date
    const formattedDate = `${months[monthIndex]}${day}${year}`;

    return formattedDate;
}
function daysAheadOfToday(formattedDate) {
    // Define months array
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    console.log(formattedDate);

    // Extract day, month, and year from the formatted date
    const monthAbbreviation = formattedDate.slice(0, 3);

    // Check the length of the day part
    let day;
    if (formattedDate.length === 9) {
    day = parseInt(formattedDate.slice(3, 5), 10); // Day has two digits
    } else if (formattedDate.length === 8) {
    day = parseInt(formattedDate.slice(3, 4), 10); // Day has one digit
    } else {
    console.log("Invalid formatted date length");
    // Handle the case where the length is neither 8 nor 9 as needed
    }

    // Extract the year substring dynamically
    const year = parseInt(formattedDate.slice(-4), 10);



    // Convert month abbreviation to month index
    const monthIndex = months.indexOf(monthAbbreviation);

    // Create a Date object for the input date
    const inputDate = new Date(year, monthIndex, day);

    // Get today's date
    const today = new Date();

    // Calculate the difference in milliseconds
    const differenceInMs = inputDate - today;

    // Convert milliseconds to days
    var daysAhead = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
    // alert(daysAhead)

    if (daysAhead < 0) {
        daysAhead = 0
    }
    // else{
    //     daysAhead = parseInt(daysAhead) + 1
    // }

    return daysAhead;
}


// Function to check for date changes
function checkForDateChange() {
    console.log('checking for a date change');
    const currentDatePath = `Winners/${formatDate(Date.now())}`;

    if (currentListenerPath !== currentDatePath) {
        // Date has changed, update the listener
        console.log(`Date changed. Updating listener to: ${currentDatePath}`);
        currentListenerPath = currentDatePath;
        startWinnersListener(currentDatePath)
        
        // Add your logic to set up the listener for the new path (currentListenerPath)
        // For example, you can call a function like startWinnersListener(currentListenerPath);
    }
}
async function updateMemberWonValue(memberPath) {
    const memberRef = admin.database().ref(`Members/${memberPath}`);
    
    // Update 'won' value to true
    await memberRef.update({ won: true });

    console.log(`Updated 'won' value to true for Member at path: Members/${memberPath}`);
}
function startWinnersListener(listenerPath) {
    // Cancel the previous listener if it exists
    if (currentWinnersListener != null) {
        console.log('winner listener exists.......cancelling listener');
        currentWinnersListener.off();
    }

    const winnersRef = admin.database().ref(listenerPath);

    winnersRef.on('child_added', async (snapshot) => {
        // Handle new child added
        const winnerData = snapshot.val();
        console.log(`New winner added at ${listenerPath}:`, winnerData);
        // Update the 'won' value in Members/winnerData.depositedFor
        await updateMemberWonValue(winnerData.depositedFor);
    });

    winnersRef.on('child_changed', (snapshot) => {
        // Handle child changed (if needed)
        const winnerData = snapshot.val();
        console.log(`Winner data changed at ${listenerPath}:`, winnerData);
    });

    // Add other event listeners as needed (child_removed, etc.)

    console.log(`Listener started for path: ${listenerPath}`);
    
    // Save the reference to the current listener
    currentWinnersListener = winnersRef;
}

async function chooseThenCount(single, pathDraw, noCount, timer, drawer, index) {
    const drawRef = admin.database().ref('Draw');
    let drawnNumbers = []
    if (single) {
        const potNumber = pathDraw.split('/')[0]
        // for (let i = 0; i < index; i++) {
        drawnNumbers.push(await chooseRandomDrawer(potNumber))           
        // }
    } else {
        for (let i = 0; i < index; i++) {
            drawnNumbers.push(await chooseRandomDrawer(null))           
        }
    }
    if (drawnNumbers.length) {
        // console.log(drawnNumbers);
        for (let j = 0; j < drawnNumbers.length; j++) {
            const element = drawnNumbers[j];
            // Loop through drawnNumbers
            for (const [childKey, chosenNumber] of Object.entries(element)) {
                if (chosenNumber != null) {
                    console.log(`Child Key: ${childKey}, Chosen Number: ${chosenNumber}`);
                    var drawPath = `${childKey}/${formatDate(Date.now())}`;
                    var drawID = drawRef.child(drawPath).push().key;
                    drawPath = `${drawPath}/${drawID}`;
                    if (single) {
                        drawPath = pathDraw
                        drawID = pathDraw.split('/')[2]
                    }
                    const drawValues = {
                        id: drawID,
                        pot:childKey,
                        drawer: chosenNumber.id,
                        timer: COUNTDOWN_DURATION,
                        used: false,
                        startedAt: DRAW_STARTED_AT,
                    };
                    if (noCount) {
                        // await updateWinners(drawPath, chosenNumber, timer, drawer)
                    } else {
                        console.log(drawPath);
                        // setSelectedRandomDrawer()
                        await drawRef.child(drawPath).update(drawValues);
                        // await drawRef.child(drawPath).update(drawValues);
                        // Start countdown
                        await startCountdown(drawPath, index);
                        
                    }
                    
                } else {
                    console.log('Chosen Number is null');
                    
                }
                
            
            }
            
        }
        
    }
    else{
        console.log('no match found from the random selector function');
    }
}
async function startDrawListener() {
    try {
        // Create a promise that resolves when the listener is triggered
        const listenerPromise = new Promise((resolve, reject) => {
            SiteSettingRef.on('value', (snapshot) => {
                snapshot.forEach(element => {
                    if (element.key == 'mst') {
                        COUNTDOWN_DURATION = parseInt(element.val());
                    } else if (element.key == 'dca') {
                        PostDailyContribution = parseInt(element.val());
                    } else if (element.key == 'dcb') {
                        PreDailContribution = parseInt(element.val());
                    } else if (element.key == 'dnw') {
                        NUMBER_OF_DRAWS = parseInt(element.val());
                    }  else if (element.key == 'su') {
                        SERVER_URL = element.val();
                    } else if (element.key == 'dt') {
                        DRAW_TIMEOUT = parseInt(element.val());
                    } else if (element.key == 'sf') {
                        SERVICE_FEE = parseInt(element.val().toString());
                    } else if (element.key == 'apm') {
                        PENALITY_FEE = parseInt(element.val().toString());
                    } else if (element.key == 'dwa') {
                        WIN_AMOUNT = parseInt(element.val());
                    } else if (element.key == 'drawStarted') {
                        DRAW_STARTED = element.val()
                        // Process accordingly based on the drawStarted value
                        if (DRAW_STARTED) {
                            DRAW_STARTED_AT = Date.now()
                            // for (let i = 0; i < NUMBER_OF_DRAWS; i++) {
                                chooseThenCount(false, null, false, 0, null, NUMBER_OF_DRAWS)
                            // }
                            // Draw has started, perform actions
                            console.log('Draw has started.');
                            // Add your logic here
                        } 
                        console.log(`Draw Started: ${DRAW_STARTED}`);
                        
                    }
                });

                // Resolve the promise when the listener is triggered
                resolve();
            });
        });

        // Wait for the listener to update values
        await listenerPromise;

    } catch (error) {
        console.error('Error in startDrawListener:', error);
    }
}

function startCountdownListener(drawPath) {
    const drawRef = admin.database().ref('Draw').child(drawPath);
    // DRAW_REF = drawRef

    drawRef.once('value', async (snapshot) => {
        if (DRAW_STARTED) {
            const children = snapshot.val();
    
            // Check if all children have status true
            const allChildrenStatusTrue = checkAllChildrenStatusTrue(children);
    
            if (allChildrenStatusTrue) {
                console.log(`All children have status true for ${drawPath}.`);
                // Add your logic here when all children have status true
                await updateSiteSettings({ drawStarted: false });
                
                // Optionally, you can remove the listener if it's no longer needed
                // drawRef.off('value');
            }
            
        }
        else{
            console.log(`draw started is set to false : ${drawPath}.`);
            // drawRef.off('value')

        }
    });
}

function checkAllChildrenStatusTrue(children) {
    for (const childKey in children) {
        if (children[childKey].used !== true) {
            return false; // At least one child has status false, so not all are true
        }
    }

    return true; // All children have status true
}

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('en-us', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
  
    return `${month}${day}${year}`;
};
async function chooseRandomDrawer(potNumber) {
    const lottoNumbersRef = admin.database().ref('LottoNumber');

    const lottoNumbersSnapshot = await lottoNumbersRef.once('value');
    const promises = [];

    lottoNumbersSnapshot.forEach((childSnapshot) => {
        const childKey = childSnapshot.key;

        if (potNumber !== null && potNumber !== childKey) {
            return; // Skip if potNumber is specified and doesn't match the current childKey
        }

        promises.push(
            (async () => {
                const randomObj = await selectRandomMember(childKey);
                return { [childKey]: randomObj };
            })()
        );
    });

    const drawnNumbersArray = await Promise.all(promises);
    const drawnNumbers = Object.assign({}, ...drawnNumbersArray);

    return drawnNumbers;
}

// Function to stop the countdown
function stopCountdown() {
    for (let i = 0; i < countdownTimeouts.length; i++) {
        const element = countdownTimeouts[i];
        // Clear the countdown timeout
        clearTimeout(element);
    }
    for (let i = 0; i < refs.length; i++) {
        const element = refs[i];
        element.off('value')
    }
    countdownTimeouts = []
    refs = []
}
async function startCountdown(drawPath,index, timer = COUNTDOWN_DURATION) {
    const drawRef = admin.database().ref('Draw').child(drawPath);
    if (!refs.includes(drawRef)) {
        refs.push(drawRef)        
    }
    startCountdownListener(drawPath)

    async function countdown() {
        // Check if draw is started
        if (!DRAW_STARTED) {
            // Draw is not started, stop the countdown
            console.log(`Admin ended the draw process.`);
            stopCountdown();
            return;
        }
    
        await drawRef.update({ timer: timer });
        // Check if status is changed to true
        const drawSnapshot = await drawRef.once('value');
        const status = drawSnapshot.child('used').val();
        const drawer = drawSnapshot.child('drawer').val();
        const startedAt = drawSnapshot.child('startedAt').val();
    
        // Calculate the difference in minutes between two Date.now() values
        const currentTime = Date.now();
        const timeDifferenceInMinutes = ((currentTime - startedAt) / (1000));
        // console.log(timeDifferenceInMinutes);

        // Check if the difference is greater than or equal to DRAW_TIMEOUT in minutes
        if (timeDifferenceInMinutes >= DRAW_TIMEOUT * 60) {
            console.log('Maximum timeout reached. Stopping the countdown.');
            stopCountdown();
            await updateSiteSettings({ drawStarted: false });
            return;
        }
    
        else if (status || timer === 0) {
            if (timer === 0) {
                console.log(`Countdown stopped for ${drawPath}. timer reached 0.`);
                chooseThenCount(true, drawPath, false, timer, drawer, null);
                console.log(`New Random member selected for ${drawPath.split('/')[0]}.`);
                
            } else {
                console.log(`Countdown stopped for ${drawPath}. Status changed to true.`);
                chooseThenCount(true, drawPath, true, timer, drawer, null);
            }
            return;
        }
    
        // Schedule the next countdown iteration after 1 second
        let countdownTimeout = setTimeout(() => {
            countdown();
        }, 1000);
        countdownTimeouts.push(countdownTimeout);
    
        timer--;
    }
    
  
    // Start the countdown
    countdown();
}
async function updateWinners(drawPath, winnerNumber, timer, drawer) {
    try {
        const winnerRef = admin.database().ref('Winners').child(drawPath);
        const snap = await winnerRef.once('value');
        winnerNumber.drawer = drawer
        winnerNumber.timer = timer
        if (!snap.exists()) {
            await winnerRef.set(winnerNumber);
            console.log(`Winner for ${drawPath} set successfully.`);
        } else {
            console.log(`Winner for ${drawPath} has already been chosen.`);
        }
    } catch (error) {
        console.error('Error updating winners:', error);
    }
}


async function updateSiteSettings(settings) {
    const settingsRef = admin.database().ref('Settings/SiteSetting');
  
    await settingsRef.update(settings);
  
    console.log('Site settings updated');
  }
  
async function selectRandomMember(potNumber) {
    const membersRef = admin.database().ref('Members');
    const memberSnap = await membersRef.once('value');

    if (memberSnap.exists()) {
        const members = Object.values(memberSnap.val());
        // console.log(members);

        const filteredMembers = members.filter(
            (member) =>
                !member.won &&
                member.online === true &&
                (potNumber === null || member.pot === potNumber)
        );

        if (filteredMembers.length) {
            const randomIndex = Math.floor(Math.random() * filteredMembers.length);
            const chosenMember = filteredMembers[randomIndex];
            return chosenMember;
        } else {
            console.log(`Unable to find a member that is online${potNumber ? ` from pot ${potNumber}` : ''} and has not gotten lucky yet.`);
            return null;
        }
    } else {
        console.log(`No members registered!`);
        return null;
    }
}


async function updateLastDate(firstTime, memberId, formattedDate) {
    const memberRef = admin.database().ref(`Members/${memberId}`);
    const todaysDate = null
    if (firstTime) {
        todaysDate = Date.now();
    }
    await memberRef.update({ lastDate: formattedDate, firstDepositDate: todaysDate }, ()=>{
        console.log(`Last date updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateServiceFee(memberId, formattedDate, ServiceFee, pot) {
    const memberRef = admin.database().ref(`ServiceFee/${pot}${formattedDate}/${memberId}`);
    await memberRef.set({ amount: ServiceFee }, ()=>{
        console.log(`Service fee (${ServiceFee}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updatePenalityFee(memberId, formattedDate, PenalityFee, penalityAmount, pot) {
    const memberRef = admin.database().ref(`PenalityFee/${pot}${formattedDate}/${memberId}`);
    await memberRef.set({ amount: penalityAmount, days: penalityAmount/PenalityFee }, ()=>{
        console.log(`Penality fee (${PenalityFee}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateDailyContribution(memberId, formattedDate, DailyContribution, pot) {
    const memberRef = admin.database().ref(`DailyContribution/${pot}/${formattedDate}/${memberId}`);
    await memberRef.set({ amount: DailyContribution }, ()=>{
        console.log(`Daily contribution (${DailyContribution}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateDeposit(amount, memberId, formattedDate) {
    const memberRef = admin.database().ref(`Members/${memberId}/Deposit`);
    await memberRef.push({ depositedAt: formattedDate, amount:amount });

    console.log(`Deposit updated for member ${memberId}: ${formattedDate}`);
}
async function setWinner(winnerMember, drawPath, drawnBy) {
    // Split drawPath by '/'
    const pathParts = drawPath.split('/');

    // Remove the first part (index 0) and join the rest back into a string
    const updatedDrawPath = pathParts.slice(1).join('/');
    winnerMember.drawnBy = drawnBy;
    winnerMember.drawnAt = Date.now();
    const winnerMemberRef = admin.database().ref(`Members/${winnerMember.depositedFor}`);
    const winnerRef = admin.database().ref(`Winners/${updatedDrawPath}`);
    const winnerRefValue = admin.database().ref(`Winners/${updatedDrawPath}`).once('value');
    const refRef = admin.database().ref(`ReferenceData/${updatedDrawPath}`);
    const refRefValue = admin.database().ref(`Winners/${updatedDrawPath}`).once('value');
    // const snapshot = await admin.database().ref(path).once('value');
    // const data = winnerRefValue.val();
    // const refData = refRefValue.val();

    if ((await winnerRefValue).exists() && (await refRefValue).exists()) {

        console.log(`Winner already set at: ${updatedDrawPath}`);
        return false;
        
    } else {
        await winnerRef.set({ winnerMember },()=>{
            refRef.set({winnerMember},()=>{
                winnerMemberRef.update({"won":true, "winAmount":WIN_AMOUNT, 'winDate': Date.now()},()=>{

                    console.log(`Winner updated at: ${updatedDrawPath}`);
                })
                
                return true;
            })
        });
        
    }
}
async function stopSpinner(drawPath) {
    const drawRef = admin.database().ref(drawPath);
    await drawRef.update({ used: true });

    console.log(`Updated used status to true @: ${drawPath}`);
}
async function fetchWinners(winnersPath) {
    const drawRef = admin.database().ref(drawPath);
    await drawRef.update({ used: true });

    console.log(`Updated used status to true @: ${drawPath}`);
}

app.listen(port, () => {
  console.log(`Server is running`);
  checkForDateChange();
  // Timer to periodically check for date changes
  setInterval(() => {
      checkForDateChange();
      console.log();
  },1 * 60 * 60 * 1000);
  console.log(`Server is running at http://localhost:${port}`);
  startDrawListener();
});
