import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../qawHelpers';

//--------------------------------
// Arrange:
//--------------------------------
// set up cutomerPhone
const cutomerPhone = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// send message
await cutomerPhone.messages
      .create({
            body: 'Hello there', 
            from: '9289107602', // use env vars
            to: '7722065400' // use env vars
      })
      .then(message => console.log("Message sent! sid:" + message.sid));

let messages = await cutomerPhone.messages.list(
    { to: '9289107602' }
);

console.log(messages)
console.log(messages.filter((message) => message.body.includes("Eloy")))
// // make a call
// cutomerPhone.calls
//       .create({
//          twiml: `<Response><Play>https://api.twilio.com/cowbell.mp3</Play></Response>`,
//          to: '7722065400', // use env vars
//          from: '5807014029' // use env vars
//        })
//       .then(call => console.log(call.sid));

//--------------------------------
// Act:
//--------------------------------



//--------------------------------
// Assert:
//--------------------------------


