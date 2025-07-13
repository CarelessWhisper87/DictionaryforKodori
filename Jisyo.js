import { marked } from "https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.esm.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push,onValue,remove} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    databaseURL:"https://jisyo-5e3b4-default-rtdb.firebaseio.com/",
    apiKey: "AIzaSyAde9UVOvMqilz3rNxMDhnpnARr7VUc8nE",
    authDomain: "jisyo-5e3b4.firebaseapp.com",
    projectId: "jisyo-5e3b4",
    storageBucket: "jisyo-5e3b4.firebasestorage.app",
    messagingSenderId: "259193863535",
    appId: "1:259193863535:web:a00ea65fe509c01b9ffc9a"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

var input = document.getElementById("inputText");
var btn = document.getElementById("searchButton");
var result = document.getElementById("resultArea");

btn.addEventListener("click", function() {
    var theword = input.value;
    if (theword === "") {
        result.innerText = "入力してください。";
        return;
    }

    var wt = "";
    var i;
    var Chinese = false;
    var Japanese = false;
    var English = false;

   //panduan
    for (i = 0; i < theword.length; i++) {
        var code = theword.charCodeAt(i);
        if (code >= 0x4E00 && code <= 0x9FFF) {
            Chinese = true;
        }
        if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
            Japanese = true;
        }
        if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        English = true;
        }
    }

    if (Japanese) {

        wt = "以下の日本語を中国語と英語に翻訳し、それぞれの言語で説明してください。余計な言葉を言わず、直接答えを出してください。出力はMarkdown形式：\n\n" + theword;
    } else if (Chinese) {
        wt = "以下の中国語を日本語と英語に翻訳し、それぞれの言語で説明してください。余計な言葉を言わず、直接答えを出してください。出力はMarkdown形式：\n\n" + theword;
    } else if (English) {
        wt = "以下の英語を日本語と中国語に翻訳し、それぞれの言語で説明してください。余計な言葉を言わず、直接答えを出してください。出力はMarkdown形式：\n\n" + theword;
    } 

    fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-20ae2dd50dc546faa97f2f1a6f4ad2be"
    },
    body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: wt }
        ],
        stream: false
    })
})
.then(function(response) {
    return response.json();
})
.then(function(data) {
    var answer = data.choices[0].message.content;
    result.innerHTML = marked.parse(answer);
    push(ref(db, 'history'), {
        word: theword,
        result: answer,
        time: new Date().toISOString()
    });
})
.catch(function(error) {
    result.innerText = "エラーが発生しました。";
});
});
//ls
const area = document.getElementById("historyArea");
const historyrr = ref(db, "history");

onValue(historyrr, function(snapshot) {
    area.innerHTML = "";
    if (snapshot.exists()) { 
        snapshot.forEach(function(childSnapshot) {
        const item = childSnapshot.val();
        const p = document.createElement("p");
        p.textContent = "[" + item.time + "] " + item.word;
        area.appendChild(p);
        });
    } else {
    area.textContent = "履歴がありません。";
    }
});

const c = document.getElementById("clearHistory");
c.addEventListener("click", function() {
  if (confirm("本当に全ての履歴を削除しますか？")) {
    remove(historyrr);
  }
});
