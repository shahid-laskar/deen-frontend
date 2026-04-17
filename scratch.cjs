const axios = require('axios');
axios.get('https://api.quran.com/api/v4/verses/by_chapter/1?words=true&word_fields=text_uthmani,text_indopak,text_tajweed').then(res => {
    console.log(JSON.stringify(res.data.verses[0], null, 2));
});
