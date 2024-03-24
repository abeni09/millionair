const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
// const rateLimit = require('express-rate-limit');
// const ExcelJS = require('exceljs');
// const readline = require('readline');
// const plotly = require('plotly')('abenij09', 'QpSdzXTsmJPyzGsDvUrp');

const serviceAccount = require('./equb-service-key.json');
// const serviceAccount = require('./serviceAccountForEqub.json');
// const serviceAccount = require('./serviceAccountForMillionair.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://equb-eb08a-default-rtdb.firebaseio.com",
    storageBucket: 'equb-eb08a.appspot.com',
});

const bucket = admin.storage().bucket();

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
let Simulated_Days = null;
let COUNTDOWN_DURATION = null;
let WIN_AMOUNT = null;
let TESTING_COUNT = 0;
let SERVER_URL = null;
let PreDailContribution = null;
let PostDailyContribution = null;
let DRAW_STARTED = false;
let NUMBER_OF_DRAWS = null;
let LAST_DATE_SIMULATED = null;
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
      let toBeUpdated = null
      var message = "Draw Ended Successfully."
      var draw_ended_at
      var daysToAdd
      const toDateConverter = 1000 * 60 * 60 * 24
    //   if (DRAW_STARTED_AT == null) {
    //     console.log("Draw Started At is NULL");
    //     DRAW_STARTED_AT = Date.now()
    //   }
    //   else{
    //     if (DRAW_STARTED_AT - Date.now() < 1) {
    //         daysToAdd = 1
            
    //     } else {
            // daysToAdd = Math.floor((DRAW_STARTED_AT - Date.now())/toDateConverter)
            // console.log(`Days to add: ${daysToAdd}`);
            
        // }

        
        draw_ended_at = DRAW_STARTED_AT
        // var daysToAdd = Math.floor((DRAW_STARTED_AT - Date.now())/(1000 * 60 * 60 * 24))
        // DRAW_STARTED_AT = addOneDayToTimestamp(Date.now(), daysToAdd)
        if (Simulated_Days != null && Simulated_Days > 0) {
            DRAW_STARTED_AT = addOneDayToTimestamp(DRAW_STARTED_AT, 1)
            Simulated_Days++
        }
        else{
            DRAW_STARTED_AT = addOneDayToTimestamp(DRAW_STARTED_AT, 0)
            Simulated_Days = 1
        }

    //   }
        if (drawStarted) {
            message = `Draw started successfully.${DRAW_STARTED_AT-Date.now()}`
            toBeUpdated = {drawStarted:drawStarted, simulatedDays: Simulated_Days, drawStartedAt: DRAW_STARTED_AT}
        }
        else{
            toBeUpdated = {drawStarted:drawStarted, simulatedDays: Simulated_Days, drawEndedAt: draw_ended_at}
        }
      await updateSiteSettings(toBeUpdated)
      
      res.status(200).json({ success: true, message: message});
    } catch (error) {
      console.error('Error starting draw:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });
  app.post('/save-user', async (req, res) => {
    try {
      const { userID, userData } = req.body;
  
      if (userID != null && userData != null) {
        return res.status(400).json({ success: false, message: 'Invalid startDraw value.' });
      }
      await saveUser(userID, userData);
      var message = "User saved Successfully."
    //   if (drawStarted) {
    //       message = 'Draw started successfully.' 
    //   }
      res.status(200).json({ success: true, message: message});
    } catch (error) {
      console.error('Error starting draw:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

// app.post('/update-deposit', async (req, res) => {
//     try {
//       const { amount, selectedMember, formattedDate } = req.body;
  
//       if (!selectedMember || !formattedDate|| !amount) {
//         return res.status(400).json({ success: false, message: 'Invalid request body.' });
//       }
  
//       await updateDeposit(amount, selectedMember, formattedDate);
  
//       res.status(200).json({ success: true, message: 'Deposit updated successfully.' });
//     } catch (error) {
//       console.error('Error updating deposit:', error);
//       res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// });
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
    console.log("Fetch winners API called");
    var { path } = req.query;
    var isAdmin = false
  
    console.log(path);
    // if (!path) {
    // //   return res.status(400).json({ error: 'Path parameter is required' });
    //     path = 'Winners'
    //     isAdmin = true
    // }
    if (!path) {
        // return res.status(400).json({ error: 'Path parameter is required' });
        isAdmin = true
        path = 'Winners'
      }
  
    try {
      const snapshot = await admin.database().ref(path).once('value');
      var data = snapshot.val();
      console.log(data);
      console.log(isAdmin);
      if (isAdmin) {
        await admin.database().ref('Winners').once('value', snap=>{
            if (snap.exists()) {
                data = []
                snap.forEach(childSnapshot=>{
                    data.push(Object.values(childSnapshot.val()))
                })                
            }
        });

      }
      if (data) {
        return res.status(200).json({data:data, message: 'Data successfully fetched' });
      } else {
        return res.status(404).json({ error: 'Data not found for the specified path' });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Define an API endpoint to fetch members and their deposits
app.get('/fetch-members-info', async (req, res) => {
    try {
      const snapshot = await admin.database().ref('Members').once('value');
      const members = [];
      const deposits = [];
  
      snapshot.forEach((element) => {
        // Fetch deposits for each member
        const depositSnapshot = element.child('Deposit');
        depositSnapshot.forEach((deposit) => {
          const newDeposit = {
            pot: element.val().pot,
            amount: deposit.val().amount,
          };
          deposits.push(newDeposit);
        });
  
        // Collect member data
        members.push(element.val());
      });
      console.log(members.length);
  
      // Respond with the collected data
      res.json({
        totalMembers: members.length,
        members: members,
        deposits: deposits,
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
app.get('/fetch-members', async (req, res) => {
  
    try {
        const data = fetchUserData();
        if (data) {
          return res.status(200).json({data:data, message: 'Data successfully fetched' });
        }else {
            return res.status(404).json({ error: 'Data not found for the specified path' });
          }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/generate-users', async (req, res) => {
    const startTime = Date.now()
  
    try {
        var startCount = 70000
        const interval = 1000
        const loopCount = 100 - 70
        var successValue
        for (let index = 0; index < loopCount; index++) {
            successValue = false
            console.log(`Index: ${index} \n\n`);
            successValue = await generateUsersJSON(interval, startCount)
            startCount = startCount + interval
        }
        // const data = await generateUsersJSON(100000,0);
        if (successValue) {
        // if (data) {
            const endTime = Date.now()
            const timeDifferenceInMinutes = ((endTime - startTime) / (1000 * 60));
            console.log(`Time wasted: ${timeDifferenceInMinutes}`);
          return res.status(200).json({data:data, message: 'Users successfully generated' });
        }else {
            return res.status(404).json({ error: 'Data not found for the specified path' });
          }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/add-phones', async (req, res) => {
    // const startTime = Date.now()
    console.log("called add phones api");
    try {
        const successValue = await addPhoneNumber();
        if (successValue) {
          return res.status(200).json({data:data, message: 'Users successfully generated' });
        }else {
            return res.status(404).json({ error: 'Data not found for the specified path' });
          }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/calculate-days', async (req, res) => {
    // const { simulateAll } = req.body;
  
    // if (typeof simulateAll !== typeof true) {
    //   return res.status(400).json({ error: 'Path parameter is required' });
    // }
  
    try {
        console.log("Calculation Started");
        // const totalDays = calculateDays(simulateAll)
        calculateDays()
            .then(result => {
                // console.log(`It will take days for all people to get 1 million ETB.`);
                return res.status(200).json({data:result, message: 'Success' });
            })
            .catch(error => {
                console.error('Error during simulation:', error);
            });
    
        // res.json(totalDays);
    } catch (error) {
      console.error('Error calculating:', error);
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
app.post('/update-pattern', async (req, res) => {
    try {
    const { drawPath, countdown, list } = req.body;
    if (!drawPath || !countdown || !list) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }

    await updatePattern(drawPath, countdown, list);

    res.status(200).json({ success: true, message: 'Pattern registered successfully.' });
    } catch (error) {
    console.error('Error registering pattern:', error);
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
        dailyContribution,
    } = req.body;

    if (
        winner == null ||
        penalityAmount == null ||
        amount == null ||
        selectedMember == null ||
        currentUser == null ||
        totalLottoTogenerate == null ||
        depositingRollNumber == null ||
        currentRollNumber == null ||
        dailyContribution == null
    ) {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }

    try {
        await processLottoGeneration({
        winner,
        penalityAmount,
        amount,
        selectedMember,
        currentUser,
        lastDate,
        totalLottoTogenerate,
        depositingRollNumber,
        currentRollNumber,
        dailyContribution,
        });

        if (winner) {
        res.status(200).json({ success: true, message: `${totalLottoTogenerate} days of payment covered for: ${selectedMember.name}` });
        } else {
        res.status(200).json({ success: true, message: `${totalLottoTogenerate} lotto numbers successfully generated for: ${selectedMember.name}` });
        }
    } catch (error) {
        console.error('Error processing lotto generation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
async function processLottoGeneration({
    winner,
    penalityAmount,
    amount,
    selectedMember,
    currentUser,
    lastDate,
    totalLottoTogenerate,
    depositingRollNumber,
    currentRollNumber,
    dailyContribution,
  }) {
    var formattedDate = null;
    var firstTime = true;
    var daysDifference = 0;
    var depoRollNumber = depositingRollNumber;
    var currRollNumber = currentRollNumber;
  
    if (lastDate != null) {
      daysDifference = daysAheadOfToday(lastDate);
      firstTime = false;
    }
  
    for (let index = 0; index < totalLottoTogenerate; index++) {
      depoRollNumber = depoRollNumber + 1;
      currRollNumber = currRollNumber + 1;
  
      if (daysDifference != 0) {
        formattedDate = formatDateNow(index + daysDifference + 1);
      } else {
        formattedDate = formatDateNow(index + daysDifference);
      }
  
      const lottoNumber = currRollNumber.toString().padStart(9, '0');
  
      if (winner) {
        await updateLastDate(firstTime, selectedMember.id, formattedDate, winner, lottoNumber).then(async ()=>{
            console.log("lastt deposit updated");
            await updateServiceFee(selectedMember.id, formattedDate, SERVICE_FEE, selectedMember.pot);
        });
  
        if (penalityAmount != 0) {
          await updatePenalityFee(selectedMember.id, formattedDate, PENALITY_FEE, penalityAmount, selectedMember.pot);
        }
      } else {
        // console.log("amount");
        // console.log(amount);
        await updateRollAndLottoNumber(firstTime, currRollNumber, lottoNumber, selectedMember.pot, formattedDate, amount, dailyContribution, selectedMember, currentUser);
      }
  
      updateDailyContribution(winner, selectedMember.id, formattedDate, dailyContribution, selectedMember.pot);
    }
  
    await updateDeposit(winner, amount, selectedMember.id, formatDateNow(0));
  }
  
  
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
            // setSnackbarMessage('Transaction was aborted.');
            return;
        }

        console.log('Roll number and current lotto number updated successfully!');
        // console.log(amount);

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
        await updateLastDate(firstTime, selectedMember.id, formattedDate, false, newCurrentLottoNumber);
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
function generateRandomName() {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';

    const getRandomChar = (characters) => characters[Math.floor(Math.random() * characters.length)];

    const randomName = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, index) => {
        return index % 2 === 0 ? getRandomChar(consonants) : getRandomChar(vowels);
    }).join('');

    return randomName.charAt(0).toUpperCase() + randomName.slice(1);
}


function generateRandomAge(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateRandomGender() {
    return Math.random() < 0.5 ? 'Male' : 'Female';
}
function generateRandomPhoneNumber() {
    // Randomly select '7' or '9' for the second digit
    const secondDigit = Math.random() < 0.5 ? '7' : '9';
  
    // Generate the remaining 9 digits
    let remainingDigits = '';
    for (let i = 0; i < 8; i++) {
      remainingDigits += Math.floor(Math.random() * 10);
    }
  
    // Construct the complete phone number
    const phoneNumber = `+251${secondDigit}${remainingDigits}`;
  
    return phoneNumber;
  }
  

function generateRandomPot() {
    // const pots = ['Pot 1', 'Pot 2', 'Pot 3', 'Pot 4', 'Pot 5', 'Pot 6', 'Pot 7', 'Pot 8', 'Pot 9', 'Pot 10'];
    const pots = ['Pot 3'];
    return pots[Math.floor(Math.random() * pots.length)];
}

function generateRandomEmail(name) {
    return `${name.replace(/\s+/g, '_').toLowerCase()}@gmail.com`;
}

function generateRandomId(email) {
    return email.replace(/[@.]/g, '');
}

async function batchDeleteData(dailyContribRef) {
    try {
        const refLotto = await dailyContribRef.once('value');

        // Create an array to store promises for all remove operations
        const removePromises = [];

        refLotto.forEach(async (element) => {
            const childLottoRef = await dailyContribRef.child(element.key).once('value');

            childLottoRef.forEach((innerChild) => {
                // Create a promise for each remove operation
                const removePromise = new Promise((resolve, reject) => {
                    dailyContribRef.child(element.key).child(innerChild.key).remove((error) => {
                        if (error) {
                            reject(error);
                        } else {
                            console.log('Removed:', element.key, innerChild.key);
                            resolve();
                        }
                    });
                });

                // Add the promise to the array
                removePromises.push(removePromise);
            });
        });

        // Wait for all remove operations to complete
        await Promise.all(removePromises).then();

        console.log(`All data in ${dailyContribRef} node has been deleted.`);
    } catch (error) {
        console.error('Error:', error);
    }
}


async function generateUsersJSON(totalUsers, startCount) {
    // const totalUsers = 100000;
    const users = [];
    let success = false;
    let count = 0;
    console.log("Generate started");
    if (startCount == 0) {
        await admin.database().ref().child('Members').remove()
        await admin.database().ref().child('Draw').remove()
        await admin.database().ref('LottoNumber/Pot 3').once('value', snap=>{
            if (snap.exists()) {
                console.log(snap.numChildren());
                snap.forEach(childSnapshot=>{
                    admin.database().ref('LottoNumber/Pot 3')
                    .child(childSnapshot.key)
                    .remove(()=>{console.log('LottoNumbers removed');})
                    
                })                
            }
        });    
        await admin.database().ref('DailyContribution/Pot 3').once('value', snap=>{
            if (snap.exists()) {
                console.log(snap.numChildren());
                snap.forEach(childSnapshot=>{
                    admin.database().ref('DailyContribution/Pot 3')
                    .child(childSnapshot.key)
                    .remove(()=>{console.log('DailyContribution removed');})
                    
                })                
            }
        });
        // await admin.database().ref().child('LottoNumber').remove()
        // await admin.database().ref().child('DailyContribution').remove()
        // await batchDeleteData(admin.database().ref().child('LottoNumber/Pot 3'))
        // await batchDeleteData(admin.database().ref().child('DailyContribution/Pot 3'))
        await admin.database().ref().child('Winners').remove()
        await admin.database().ref().child('ReferenceData').remove()
        await admin.database().ref().child('Settings/SiteSetting/drawStartedAt').remove()
        await admin.database().ref().child('Settings/SiteSetting/simulatedDays').remove()
    }

    for (let i = startCount; i < startCount + totalUsers; i++) {
        // const name = generateRandomName();
        const number = i.toString().padStart(6,'0')
        const name = `Akalu${number}`;
        const age = generateRandomAge(20, 40);
        const gender = generateRandomGender();
        const pot = generateRandomPot();
        const won = false;
        const email = generateRandomEmail(name);
        const id = generateRandomId(email);

        users.push({ name, age, gender, pot, won, email, id, winAmount: WIN_AMOUNT , isBanned: false, online: false});
        count++
        // console.log(count);
        // const sanitizedEmail = email.replace('@','').replace('.','')
        // try {
        //     await admin.database().ref().child('Members').child(id).set({
        //         name: 'User_' +  name, 
        //         id:id, age:age, 
        //         gender:gender, 
        //         pot:pot, 
        //         won:won, 
        //         winAmount: WIN_AMOUNT 
        //     }, ()=>{
        //         console.log(`User ${email} successfully registered!` );
        //         count++;
        //     })
        // } catch (error) {
        //     console.log(error);
            
        // }
        // console.log(name);
    }

    if(count == totalUsers){
        console.log(users.length);
        // Batch size - adjust as needed
        const batchSize = 20000;

        // Function to write a batch of data to the database
        const writeBatch = async (batch) => {
            try {
                await admin.database().ref().child('Members').update(batch);
                console.log("Members batch written to the database successfully.");
                success = true;
            } catch (error) {
                console.error("Error writing members to the database:", error);
            }
        };

        // Chunk the array into batches
        for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize).reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
        }, {});
        // Log the length of the batch
        console.log(`Batch length: ${Object.keys(batch).length}`);
        // Write each batch
        writeBatch(batch);
        }
        success = true
    }
    if (success) {
        const number = startCount.toString().padStart(6,'0')
        const name = `akalu${number}gmailcom`;
        const membersdata = await admin.database().ref().child('Members').orderByKey().startAt(name).limitToFirst(totalUsers).once('value');
        const members = Object.values(membersdata.val());
        let currentRollNumber = startCount * 90;

        const promises = [];
        members.forEach((element) => {
            promises.push(processLottoGeneration({
                winner: false,
                penalityAmount: 0,
                amount: 4500,
                selectedMember: element,
                currentUser: { email: "admin@admin.admin" },
                lastDate: element['lastDate'],
                totalLottoTogenerate: 4500 / 50,
                depositingRollNumber: 0,
                currentRollNumber,
                dailyContribution: 50,
            }));

            // Increment currentRollNumber by 90 after processLottoGeneration
            currentRollNumber += 90;
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        // Fetch members from the database

        // const membersdata = await admin.database().ref().child('Members').once('value');
        // const members = Object.values(membersdata.val());
        // let currentRollNumber = 0;
        
        // const promises = members.map(async (element) => {
        //     await processLottoGeneration({
        //         winner: false,
        //         penalityAmount: 0,
        //         amount: 4500,
        //         selectedMember: element,
        //         currentUser: { email: "admin@admin.admin" },
        //         lastDate: element['lastDate'],
        //         totalLottoTogenerate: 4500 / 50,
        //         depositingRollNumber: 0,
        //         currentRollNumber,
        //         dailyContribution: 50,
        //     });
        //     console.log(currentRollNumber);
        
        //     // Increment currentRollNumber by 90 after processLottoGeneration
        //     currentRollNumber += 90;
        // });
        
        // // Wait for all promises to complete
        // await Promise.all(promises);
        

        
        // const membersdata = await admin.database().ref().child('Members').once('value');
        
        // const members = Object.values(membersdata.val());
        // var currentRollNumber = 0
        // for (let i = 0; i < members.length; i++) {
        //     const element = members[i];
        //     console.log(`Starting roll number: ${currentRollNumber}`); 
        //     await processLottoGeneration({
        //         winner: false,
        //         penalityAmount:0,
        //         amount:4500,
        //         selectedMember: element,
        //         currentUser:{email:"admin@admin.admin"},
        //         lastDate:element['lastDate'],
        //         totalLottoTogenerate:4500/50,
        //         depositingRollNumber:0,
        //         currentRollNumber,
        //         dailyContribution:50,
        //         });
        //     currentRollNumber = currentRollNumber + 4500/50
            
        // }
    }
    return (success)

    // Write user data to a JSON file
    // const jsonData = JSON.stringify(users, null, 2);
    // fs.writeFileSync('user_data.json', jsonData);
    // return
    // return 'User data generated.';
}
async function addPhoneNumber(){
    try {
        // const startCount = 0
        const interval = 1000000
        for (let i = 0; i < interval; i++) {
            const number = i.toString().padStart(6, '0');
            const name = `akalu${number}gmailcom`;
            // const email = `akalu${number}.gmailcom`;
            const randomPhoneNumber = generateRandomPhoneNumber();
            await admin.database().ref(`Members/${name}`).update({phone: randomPhoneNumber},()=>{
                admin.database().ref('EmailToPhone').child(randomPhoneNumber).set({email:name})
                console.log(`Phone number ${randomPhoneNumber} added to ${name}`);
            })

        }
    } catch (error) {
        console.log(error);
        
    }
        
      

}
// Call the function to generate users
// generateUsersJSON(100000);

function fetchUserData(){
    
    // Read the user data
    const userJsonData = fs.readFileSync('user_data.json', 'utf-8');
    const userData = JSON.parse(userJsonData);
    // for user in userData
    return userData
}
function selectRandomObjectsFromFiles(directoryPath, day) {
    const selectedObjects = [];

    // Generate the file name based on the day
    const fileName = `day_${day}_lottoNumbers.json`;
    const filePath = path.join(directoryPath, fileName);

    try {
        // Read and parse the JSON content
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        const jsonObjects = JSON.parse(jsonData);

        // Read the user data
        const userJsonData = fs.readFileSync('user_data.json', 'utf-8');
        const userData = JSON.parse(userJsonData);

        // Select 5 random objects from the file
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * jsonObjects.length);
            const selectedObject = jsonObjects[randomIndex];
            const userId = selectedObject.for;

            // Check the won property from the user data
            const userIndex = userData.findIndex(user => user.id === userId);

            if (userIndex !== -1 && !userData[userIndex].won) {
                // If user hasn't won before, mark them as won and add the selected object to the overall result
                userData[userIndex].won = true;
                userData[userIndex].wonday = day;
                selectedObjects.push(selectedObject);
            } else {
                // If user has won or not found, select another object
                i--;
            }
        }

        // Update the user data file with the modified userData
        const updatedUserDataJson = JSON.stringify(userData, null, 2);
        fs.writeFileSync('user_data.json', updatedUserDataJson);

    } catch (error) {
        console.error(`Error reading or parsing file ${filePath} or user_data.json:`, error.message);
    }

    return selectedObjects;
}


// async function calculateDays(all) {
//     let totalPeople = 100000;
//     let winners = 0;
//     const initialContribution = 50;
//     const initialPrize = 1000000;
//     const increasedContribution = 550;

//     let totalContribution = totalPeople * initialContribution;
//     let days = 0;
//     let day = 0;

//     const simulationResults = [];
//     let listOfSelectedObjects = [];

//     async function writeNextRow() {
//         // Check if simulation is complete
//         if (all) {
                        
//             const lottoNumbersDirectory = 'LottoNumbers';
//             const selectedObjects = selectRandomObjectsFromFiles(lottoNumbersDirectory, 1); // Replace 1 with the desired day

//             console.log('Selected Objects:', selectedObjects);
//             return selectedObjects;
//         }
//         else{
//             while (days < 1826) {
//                 const totalDepositedWinners = winners * increasedContribution;
//                 const totalDepositedNonWinners = totalPeople * initialContribution;
//                 totalContribution = totalDepositedNonWinners + totalDepositedWinners;
    
//                 // Calculate counts and amounts
//                 const dailyPayout = Math.floor(totalContribution / initialPrize) * initialPrize;
//                 const netAmount = totalContribution - dailyPayout;
    
//                 // Increment the number of days
//                 days++;
                
//                 // const lottoNumbersDirectory = 'LottoNumbers';
//                 // const selectedObjects = selectRandomObjectsFromFiles(lottoNumbersDirectory, days); // Replace 1 with the desired day
//                 // listOfSelectedObjects.push(selectedObjects)
//                 // console.log('Selected Objects:', selectedObjects);
//                 // const dailyResults = [];
    
//                 // users.forEach(user => {
//                 //     const lottoNumber = day.toString().padStart(9, '0'); // Pad the day to 9 digits
//                 //     const contribution = user.won ? 550 : 50; // If user won, contribute 550, otherwise 50
        
//                 //     // Save results for each user
//                 //     dailyResults.push({
//                 //         day:day,
//                 //         for: user.id,
//                 //         lottoNumber:lottoNumber,
//                 //         won: false,
//                 //         pot:'Pot 1',
//                 //         contribution: contribution,
//                 //     });
//                 //     day++;
//                 // });
                
//                 // // Write the simulation results to a JSON file
//                 // const folderPath = 'LottoNumbers'
//                 // const jsonFileName = `day_${days}_lottoNumbers.json`;
//                 // const jsonFilePath = path.join(folderPath, jsonFileName);
//                 // const jsonData = JSON.stringify(dailyResults, null, 2);
//                 // fs.writeFileSync(jsonFilePath, jsonData);
    
//                 // console.log('JSON file generated successfully.');
//                 // Save results for the day
//                 // simulationResults.push({
//                 //     day: days,
//                 //     winners: winners,
//                 //     totalPeople: totalPeople,
//                 //     totalDepositedNonWinners: totalDepositedNonWinners,
//                 //     totalDepositedWinners: totalDepositedWinners,
//                 //     totalContribution: totalContribution,
//                 //     dailyPayout: dailyPayout,
//                 //     netAmount: netAmount,
//                 // });
    
//                 totalPeople = totalPeople - Math.floor(totalContribution / initialPrize);
//                 winners += Math.floor(totalContribution / initialPrize);
    
//                 const algoRef = admin.database().ref(`Settings/Algorithm`);
//                 await algoRef.child(days).set({
//                     day: days,
//                     winners: winners,
//                     totalPeople: totalPeople,
//                     totalDepositedNonWinners: totalDepositedNonWinners,
//                     totalDepositedWinners: totalDepositedWinners,
//                     totalContribution: totalContribution,
//                     dailyPayout: dailyPayout,
//                     netAmount: netAmount,
//                 });
    
//                 // Update the total contribution for the next day
//                 if (days >= 1826) {
//                     // Write simulation results to a JSON file once the simulation is complete
//                     // const jsonData = JSON.stringify(simulationResults, null, 2);
//                     // fs.writeFileSync('drawAlgorithm.json', jsonData);
//                     // console.log('JSON file generated successfully.');
//                     return listOfSelectedObjects;
//                 }
    
//                 setImmediate(writeNextRow);
//             }

//         }
//     }

//     // Start writing rows
//     await writeNextRow();

//     return days;
// }
// const chartData = [{
//     x: [],
//     y: [],
//     type: 'scatter',
//     mode: 'lines+markers',
//     name: 'Net Amount',
// }];

// const chartOptions = { filename: 'lotto-simulation-chart', fileopt: 'overwrite' };

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
async function calculateDays() {
    const MembersRef = admin.database().ref('Members')
    const lottoSettingsRef = admin.database().ref('Settings/LottoSetting');
    const SiteSettingsRef = admin.database().ref('Settings/SiteSetting/drawStartedAt');
    const SimulatedDaysRef = admin.database().ref('Settings/SiteSetting/simulatedDays');
    
    var lottoSettingsValues = [];
    var drawDate = null;
    let days = 0;

    try {
        const snapshot = await SiteSettingsRef.once('value');
        
        if (snapshot.exists()) {
            drawDate = addOneDayToTimestamp(snapshot.val(), 1);
        } else {
            drawDate = Date.now();
        }
    } catch (error) {
        console.error("Error fetching SiteSettings:", error);
    }  
    await SimulatedDaysRef
    .once('value', snapshot => {
        if (snapshot.exists()) {
            days = parseInt(snapshot.val());
        }
    });
     
    lottoSettingsRef
    // .orderByChild('status').equalTo('Open')
    .on('value', snapshot => {
        lottoSettingsValues = []
        if (snapshot.exists()) {
            snapshot.forEach(element => {
                var newElement = {
                    pot: null,
                    currentLottoNumber: null,
                    rollNumber: null,
                    updatedAt: null,
                }
                newElement.pot = element.key
                newElement.currentLottoNumber = element.val()['currentLottoNumber']
                newElement.rollNumber = element.val()['rollNumber']
                newElement.updatedAt = element.val()['updatedAt']
                lottoSettingsValues.push(newElement)
            });
        }
    });
    let totalPeople = 100000;
    let nonWinners = 100000;
    let winners = 0;
    let loopedDepositedWinners = 0
    let loopedDepositedNonWinners = 0
    const initialContribution = 50;
    const initialPrize = 1000000;
    const increasedContribution = 550;
    const maxDays = 10000;

    let finishedWinners = 0
    let netAmount = 0
    let totalContribution = 0;
    const memberSnap = await MembersRef.once('value')
    const depositsPerPerson = Object.values(memberSnap.val());
    totalPeople = depositsPerPerson.length
    nonWinners = depositsPerPerson.filter((member) => !member.won).length
    winners = depositsPerPerson.filter((member) => member.won).length
    // const depositsPerPerson = Array.from({ length: totalPeople }, () => 0);
    let responseList = []
    // // Create a new workbook and add a worksheet
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('LottoSimulation');

    // // Set up the header row
    // worksheet.addRow([
    //     'Day',
    //     'Total Winners',
    //     'Non-Winners',
    //     'Winners Daily Deposit',
    //     'Non-Winners Daily Deposit',
    //     'Total Contribution',
    //     'Daily Payout',
    //     'Daily Winners',
    //     'Net Amount',
    //     'Finished Winners',
    // ]);

    async function writeNextRow() {
        // Check if simulation is complete
        // while (totalPeople > 0) {
            // console.log(days);
            // console.log(`total people: ${totalPeople}`);
            // console.log(depositsPerPerson.length);
            // console.log(winners);
            // console.log(days);
            // console.log(netAmount);
            const totalDepositedWinners = winners * increasedContribution;
            if (days > maxDays) {
                nonWinners = 0
            }
            // console.log(totalDepositedWinners);
            const totalDepositedNonWinners = nonWinners * initialContribution;
            totalContribution = totalDepositedNonWinners + totalDepositedWinners + netAmount;
            // Calculate counts and amounts
            const dailyPayout = Math.floor(totalContribution / initialPrize) * initialPrize;
            // console.log(`Day ${days}: ${totalContribution}`);
            netAmount = totalContribution - dailyPayout;
            // Update deposits for each person
            // const promises = depositsPerPerson.forEach(async (_, index) => {
            for (const [index, _] of depositsPerPerson.entries()) {

                let selectedMember = depositsPerPerson[index]
                let winner = selectedMember.won

                let lastDate = selectedMember.lastDate
                
                // Search for an object with rollNumber and currentLottoNumber
                console.log(lottoSettingsValues);
                let searchedObject = lottoSettingsValues.find(obj => obj.pot === depositsPerPerson[index].pot);
                let currentRollNumber = null
                let currentLottoNumber = null
                if (searchedObject) {
                    console.log(searchedObject);
                    currentRollNumber = parseInt(searchedObject.rollNumber)
                    currentLottoNumber = parseInt(searchedObject.currentLottoNumber)
                } else {
                    currentRollNumber = 0
                    currentLottoNumber = 0
                }
                let totalDeposit = depositsPerPerson[index].totalDeposit || 0
                if (days === 0) {
                    // On the first day, everyone deposits initialContribution
                    totalDeposit += initialContribution 
                    depositsPerPerson[index].totalDeposit = totalDeposit;
                    // console.log(depositsPerPerson[index].totalDeposit);
                    // console.log(initialContribution);
                    
                    // Use Promise.resolve to ensure consistency in the return value
                    // result = await Promise.resolve();
                        await processLottoGeneration({
                            winner,
                            penalityAmount:0, 
                            amount:initialContribution,
                            selectedMember,
                            currentUser:{email:"admin@admin.admin"},
                            lastDate,
                            totalLottoTogenerate:1,
                            depositingRollNumber:0,
                            currentRollNumber,
                            dailyContribution:initialContribution,
                          }).then(()=>{
                            console.log("Success");
                          })
                        

                } else if (depositsPerPerson[index].won) {
                    // From the second day onwards, only winners deposit increasedContribution
                    const remainingToPrize = initialPrize - depositsPerPerson[index];
                    if (remainingToPrize > 0) {
                        totalDeposit +=  Math.min(remainingToPrize, increasedContribution) 
                        depositsPerPerson[index].totalDeposit = totalDeposit;
                        await processLottoGeneration({
                            winner,
                            penalityAmount:0,
                            amount:Math.min(remainingToPrize, increasedContribution),
                            selectedMember,
                            currentUser:{email:"admin@admin.admin"},
                            lastDate,
                            totalLottoTogenerate:1,
                            depositingRollNumber:0,
                            currentRollNumber,
                            dailyContribution:Math.min(remainingToPrize, increasedContribution),
                          })
                    }

                    // If the total deposit reaches initialPrize, remove that person from the list
                    if (depositsPerPerson[index].totalDeposit >= initialPrize) {
                        winners--;
                        depositsPerPerson.splice(index, 1);
                        finishedWinners += 1
                        // console.log("1 person finished");
                    }
                } else {
                    if (days < maxDays) {
                        // Non-winners continue depositing initialContribution
                        totalDeposit += initialContribution 
                        depositsPerPerson[index].totalDeposit = totalDeposit;
                        await processLottoGeneration({
                            winner,
                            penalityAmount:0, 
                            amount:initialContribution,
                            selectedMember,
                            currentUser:{email:"admin@admin.admin"},
                            lastDate,
                            totalLottoTogenerate:1,
                            depositingRollNumber:0,
                            currentRollNumber,
                            dailyContribution:initialContribution,
                          })
                        
                    }
                    // else{
                    //     totalPeople--
                    // }
                    // console.log("are these all non winners");
                    // console.log(winners);
                }
                
                depositsPerPerson[index].lastDate = formatDate(addOneDayToTimestamp(Date.now(),days)) 
                console.log(depositsPerPerson[index]);
                // console.log(depositsPerPerson[index].lastDate);
                // console.log(`non winners: ${loopedDepositedNonWinners}`);
                // console.log(`winners: ${loopedDepositedWinners}`);
            };
            // });
            
            // Wait for all promises to resolve
            // await Promise.all(promises);
            
            // console.log(`Finished winners ${finishedWinners}`);
            console.log(drawDate);
            await updateSiteSettings({ drawStarted: true, simulatedDays: days++, drawStartedAt: drawDate});
            console.log(days);
            // Increment the number of days
            // days++;

            // Add a new row to the worksheet
            // worksheet.addRow([
            //     days,
            //     winners,
            //     totalPeople,
            //     totalDepositedWinners,
            //     totalDepositedNonWinners,
            //     totalContribution,
            //     dailyPayout,
            //     dailyPayout/initialPrize,
            //     netAmount,
            //     finishedWinners
            // ]);
            responseList.push({
                days: days,
                winners: winners,
                totalPeople: totalPeople,
                totalDepositedWinners: totalDepositedWinners,
                totalDepositedNonWinners: totalDepositedNonWinners,
                totalContribution: totalContribution,
                dailyPayout: dailyPayout,
                dailyWinners: dailyPayout/initialPrize,
                netAmount: netAmount,
                finishedWinners: finishedWinners,

            })

            // Update the chart data
            // chartData[0].x.push(days);
            // chartData[0].y.push(netAmount);

            // Update the chart
            // plotly.plot(chartData, chartOptions, (err, msg) => {
            //     if (err) return console.error(err);
            //     console.log(msg);
            // });

            // totalPeople = totalPeople - Math.floor(totalContribution / initialPrize);
            // nonWinners = nonWinners - Math.floor(totalContribution / initialPrize);
            // winners += Math.floor(totalContribution / initialPrize);
            // console.log(`New winners ${Math.floor(totalContribution / initialPrize)}`);
            // const algoRef = admin.database().ref(`Settings/Algorithm`);
            // await algoRef.child(days).set({
            //     day: days,
            //     winners: winners,
            //     totalPeople: totalPeople,
            //     totalDepositedNonWinners: totalDepositedNonWinners,
            //     totalDepositedWinners: totalDepositedWinners,
            //     totalContribution: totalContribution,
            //     dailyPayout: dailyPayout,
            //     netAmount: netAmount,
            // });
            

            // Update the total contribution for the next day
            // if (totalPeople <= 0) {
            //     // Save the workbook to a file once the simulation is complete
            //     await workbook.xlsx.writeFile('lotto_simulation_results.xlsx');
            //     console.log('Excel file generated successfully.');
                
            //     return false
                
            // }
            // else if (totalPeople > 0) {
            //     setImmediate(writeNextRow);
                
            // }
            // else{
            //     return false;
            // }

        
        // }
    }

    // Start writing rows
    await writeNextRow();

    return responseList;
    // Upload the Excel file to Firebase Storage
    const uploadResult = await bucket.upload('lotto_simulation_results.xlsx', {
        destination: 'lotto_simulation_results.xlsx',
    });

    // Get the download URL
    const downloadURL = await uploadResult[0].getSignedUrl({
        action: 'read',
        expires: '03-09-2025', // Set an appropriate expiration date
    });

    // Return the download URL
    return downloadURL;
    // Close the readline interface when simulation is complete
    // rl.close();
    // return days;
}
function addOneDayToTimestamp(timestamp,count) {
    // Create a Date object from the timestamp
    const dateObject = new Date(timestamp);
  
    // Add one day to the date
    dateObject.setDate(dateObject.getDate() + count);
  
    // Return the timestamp of the updated date
    return dateObject.getTime();

  }
async function chooseThenCount(single, pathDraw, noCount, timer, drawer, index, lastDate) {
    const drawRef = admin.database().ref('Draw');
    // const currentTimestamp = Date.now();
    var potNumber = ''
    // var dateObject = Date.now()
    // if (lastDate != null) {
    //     dateObject = addOneDayToTimestamp(lastDate, 1)
    // }

    // console.log(dateObject);

    let drawnNumbers = []
    if (single) {
        potNumber = pathDraw.split('/')
        // for (let i = 0; i < index; i++) {
            const randomDrawer = await chooseRandomDrawer(potNumber[0])
            if (randomDrawer != null) {
                drawnNumbers.push(randomDrawer)     
            }              
        // }
    } else {
        for (let i = 0; i < index; i++) {
            const randomDrawer = await chooseRandomDrawer(null)
            // console.log(randomDrawer);
            if (randomDrawer != null) {
                drawnNumbers.push(randomDrawer)     
            }      
        }
    }
    // console.log(drawnNumbers);
    if (drawnNumbers.length > 0) {
        for (let j = 0; j < drawnNumbers.length; j++) {
            const element = drawnNumbers[j];
            // Loop through drawnNumbers
            for (const [childKey, chosenNumber] of Object.entries(element)) {
                if (chosenNumber != null) {
                    console.log(`Child Key: ${childKey}, Chosen Number: ${chosenNumber}`);
                    var drawPath = `${childKey}/${potNumber[1]}`
                    if (!single) {
                        drawPath = `${childKey}/${formatDate(lastDate)}`;
                    }
                    var drawID = drawRef.child(drawPath).push().key;
                    drawPath = `${drawPath}/${drawID}`;
                    // if (single) {
                    //     drawPath = pathDraw
                    //     drawID = pathDraw.split('/')[2]
                    // }
                    const drawValues = {
                        id: drawID,
                        pot:childKey,
                        drawer: chosenNumber.id,
                        timer: COUNTDOWN_DURATION,
                        used: false,
                        startedAt: DRAW_STARTED_AT,
                    };
                    if (!noCount) {
                        // break
                        console.log(drawPath);
                        // setSelectedRandomDrawer()
                        await drawRef.child(drawPath).update(drawValues).then(async ()=>{
                            // Start countdown
                            await startCountdown(drawPath, index)});
                        // await drawRef.child(drawPath).update(drawValues);;
                        
                    }
                    // else{
                        // await updateWinners(drawPath, chosenNumber, timer, drawer)
                    // } 
                } else {
                    console.log('Chosen Number is null');
                    
                }
                
            
            }
            
        }
        
    }
    else{
        console.log('no match found from the random selector function');
        updateSiteSettings({drawStarted: false, drawEndedAt: dateObject})
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
                    }  else if (element.key == 'drawStartedAt') {
                        DRAW_STARTED_AT = parseInt(element.val());
                    }  else if (element.key == 'simulatedDays') {
                        Simulated_Days = parseInt(element.val());
                    } else if (element.key == 'drawStarted') {
                        DRAW_STARTED = element.val()
                        DRAW_STARTED_AT = Date.now()
                        if (snapshot.child('drawStartedAt').val() != null) {
                            DRAW_STARTED_AT = parseInt(snapshot.child('drawStartedAt').val())
                            
                        }
                        // Process accordingly based on the drawStarted value
                        if (DRAW_STARTED) {
                            
                            // // var dateObject = Date.now()
                            // if (LAST_DATE_SIMULATED != null) {
                            //     DRAW_STARTED_AT = LAST_DATE_SIMULATED
                            // }
                            // if (TESTING_COUNT > 0 && TESTING_COUNT != null) {
                            //     for (let i = 0; i < TESTING_COUNT; i++) {
                                    chooseThenCount(false, null, false, 0, null, NUMBER_OF_DRAWS, DRAW_STARTED_AT)
                            //     }
                                
                            // }
                            // else{
                            //     chooseThenCount(false, null, false, 0, null, NUMBER_OF_DRAWS, 0)
                            // }
                            // Draw has started, perform actions
                            // console.log('Draw has started.');
                        } 
                        console.log(`Draw Started: ${DRAW_STARTED}`);
                        console.log(`Draw Started: ${DRAW_STARTED_AT}`);
                        
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

    const promises = [];
    var randomMembers = null
    try {
        const snapshot = await lottoNumbersRef.once('value');
        
        if (snapshot.exists()) {
            

            snapshot.forEach((childSnapshot) => {
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
            console.log(drawnNumbers);
            randomMembers = drawnNumbers
            console.log(randomMembers);
        } else {
            randomMembers = null
        }

        // Now you can use drawDate safely
        // ... rest of your code ...
    } catch (error) {
        console.error("Error fetching SiteSettings:", error);
    }
    return randomMembers
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
async function startCountdown(drawPath,index, timer = COUNTDOWN_DURATION, draw_timer = DRAW_TIMEOUT * 60) {
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
        const status = await drawSnapshot.child('used').val();
        const drawer = await drawSnapshot.child('drawer').val();
        const startedAt = await drawSnapshot.child('startedAt').val();
    
        // Calculate the difference in seconds between two Date.now() values
        // var daysToAdd
        // const toDateConverter = 1000 * 60 * 60 * 24
        // if (startedAt == null) {
        //     daysToAdd = 0
        //     startedAt = Date.now()
        // }
        // else{
        // if (startedAt - Date.now() < 1) {
        //     daysToAdd = Math.ceil((startedAt - Date.now())/toDateConverter)
            
        // } else {
        //     daysToAdd = Math.floor((startedAt - Date.now())/toDateConverter)
            
        // }
        // }
        // console.log(`differece: ${startedAt - Date.now()}`);
        // console.log(`days to add: ${daysToAdd}`);
        // const currentTime = addOneDayToTimestamp(Date.now(), daysToAdd);
        // const timeDifferenceInSeconds = ((currentTime - startedAt) / (1000));
        // console.log(`difference in seconds: ${timeDifferenceInSeconds}`);
        console.log(formatDate(DRAW_STARTED_AT));
        console.log(draw_timer);
        DRAW_TIMEOUT = draw_timer/60

        // Check if the difference is greater than or equal to DRAW_TIMEOUT in Seconds
        if (draw_timer < 1) {
            console.log(`Maximum timeout reached. Stopping the countdown.${DRAW_TIMEOUT} | ${draw_timer}`);
            stopCountdown();
            await updateSiteSettings({ drawStarted: false });
            return;
        }
    
        else if (status || timer === 0) {
            if (timer === 0) {
                console.log(`Countdown stopped for ${drawPath}. timer reached 0.`);
                chooseThenCount(true, drawPath, false, timer, drawer, null,DRAW_STARTED_AT);
                console.log(`New Random member selected for ${drawPath.split('/')[0]}.`);
                
            } else {
                console.log(`Countdown stopped for ${drawPath}. Status changed to true.`);
                // chooseThenCount(true, drawPath, true, timer, drawer, null);
            }
            return;
        }
    
        // Schedule the next countdown iteration after 1 second
        let countdownTimeout = setTimeout(() => {
            countdown();
        }, 1000);
        countdownTimeouts.push(countdownTimeout);
    
        timer--;
        draw_timer--;
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
async function saveUser(userID, userData) {
    const settingsRef = admin.database().ref('Users');
  
    await settingsRef.child(userID).update(userData);
  
    console.log('User save successfully');
  }
  
async function selectRandomMember(potNumber) {
    const membersRef = admin.database().ref('Members').orderByChild('won').equalTo(false);
    // .child(potNumber);
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


async function updateLastDate(firstTime, memberId, formattedDate, winner, lottoNumber) {
    const memberRef = admin.database().ref(`Members/${memberId}`);
    var todaysDate = null
    if (firstTime) {
        todaysDate = Date.now();
    }
    await memberRef.update({ lastDate: formattedDate, firstDepositDate: todaysDate }, ()=>{
        if (!winner) {
            memberRef.child('LottoNumbers').child(formattedDate).set({lottoNumber:lottoNumber, winner:winner})
        }
        console.log(`Last date updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateServiceFee(memberId, formattedDate, ServiceFee, pot) {
    const memberRef = admin.database().ref(`ServiceFee/${pot}${formattedDate}/${memberId}`);
    await memberRef.push({ amount: ServiceFee }, ()=>{
        console.log(`Service fee (${ServiceFee}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updatePenalityFee(memberId, formattedDate, PenalityFee, penalityAmount, pot) {
    const memberRef = admin.database().ref(`PenalityFee/${pot}${formattedDate}/${memberId}`);
    await memberRef.push({ amount: penalityAmount, days: penalityAmount/PenalityFee }, ()=>{
        console.log(`Penality fee (${PenalityFee}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateDailyContribution(winner, memberId, formattedDate, DailyContribution, pot) {
    const memberRef = admin.database().ref(`DailyContribution/${pot}/${formattedDate}/${memberId}`);
    var status = 'Before'
    if (winner) {
        status = 'After'
    }
    await memberRef.push({ amount: DailyContribution, status: status}, ()=>{
        console.log(`Daily contribution (${DailyContribution}) updated for member ${memberId}: ${formattedDate}`);
        return true
    });

}
async function updateDeposit(winner, amount, memberId, formattedDate) {
    var status = 'Before'
    if (winner) {
        status = 'After'
    }
    const memberRef = admin.database().ref(`Members/${memberId}/Deposit`);
    await memberRef.push({ depositedAt: formattedDate, amount:amount, status: status});

    console.log(`Deposit updated for member ${memberId}: ${formattedDate}`);
}
async function setWinner(winnerMember, drawPath, drawnBy) {
    // Split drawPath by '/'
    const pathParts = drawPath.split('/');

    // Remove the first part (index 0) and join the rest back into a string
    const updatedDrawPath = pathParts.slice(1).join('/');
    const lottNumberPath = pathParts[2];
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
                winnerMemberRef.update({"won":true, "winAmount":WIN_AMOUNT, 'winDate': Date.now(), 'winnerNumber':winnerMember.currentLottoNumber},()=>{
                    winnerMemberRef.child("LottoNumbers").child(lottNumberPath).update({winner:true})
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
async function updatePattern(drawPath, countdown, list) {
    const drawRef = admin.database().ref(drawPath).child('Pattern').child(countdown);
    await drawRef.push(list);

    console.log(`Registered pattern @: ${drawPath}`);
}
async function fetchWinners(winnersPath) {
    const drawRef = admin.database().ref(drawPath);
    await drawRef.update({ used: true });

    console.log(`Updated used status to true @: ${drawPath}`);
}

app.listen(port, async () => {
  console.log(`Server is running`);
//   checkForDateChange();
//   // Timer to periodically check for date changes
//   setInterval(() => {
//       checkForDateChange();
//       console.log();
//   },1 * 60 * 60 * 1000);
  console.log(`Server is running at http://localhost:${port}`);
  startDrawListener();
//   const snapshot = admin.database().ref('LottoNumber/Pot 3').once('value')
//   var data = snapshot.val();
  
// await admin.database().ref('LottoNumber/Pot 3').once('value', snap=>{
//     if (snap.exists()) {
//         console.log(snap.numChildren());
//         snap.forEach(childSnapshot=>{
//             admin.database().ref('LottoNumber/Pot 3')
//             .child(childSnapshot.key)
//             .remove(()=>{console.log('LottoNumbers removed');})
            
//         })                
//     }
// });    
// await admin.database().ref('DailyContribution/Pot 3').once('value', snap=>{
//     if (snap.exists()) {
//         console.log(snap.numChildren());
//         snap.forEach(childSnapshot=>{
//             admin.database().ref('DailyContribution/Pot 3')
//             .child(childSnapshot.key)
//             .remove(()=>{console.log('DailyContribution removed');})
            
//         })                
//     }
// });
// const startCount = 700;
// const number = startCount.toString().padStart(6, '0');
// const name = `akalu${number}gmailcom`;

// await admin.database().ref('Members')
//     .orderByKey()
//     .startAt(name)
//     .limitToFirst(100)
//     .once('value', (snap) => {
//         if (snap.exists()) {
//             snap.forEach((child)=>{
//                 console.log(child.key);
    
//             })
//             console.log(snap.numChildren());
//         } else {
//             console.log('No data');
//         }
//     });

// const members = Object.values(membersdata.val());
// console.log(members);
});
