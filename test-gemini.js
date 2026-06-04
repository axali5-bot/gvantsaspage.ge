const key = 'AIzaSyDuiZaQWQcliFK41-PDveB9l45_ktcViME';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }] })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
