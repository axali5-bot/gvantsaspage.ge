const key = 'AIzaSyDuiZaQWQcliFK41-PDveB9l45_ktcViME';
const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + key;

fetch(url)
.then(r => r.json())
.then(data => console.log(data.models ? data.models.map(m => m.name) : data))
.catch(console.error);
