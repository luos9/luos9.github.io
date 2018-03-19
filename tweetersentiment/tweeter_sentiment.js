'use strict'; //treat silly mistakes as run-time errors
//SENTIMENTS, EMOTIONS, and SAMPLE_TWEETS have already been "imported"

/* Your script goes here */


/*
the function takes a word's text 
and split it up into a array of individual words
and return the array of lower-case words.
*/
function splitText(text) {
    text = text.toLowerCase().split(/\W+/);
    return text;
}


/*
the function takes a array of words
and filters out any word that have 1 letter or fewer
and return the array.
*/
function longWords(text) {
    return text.filter(function(i) {
        return i.length > 1;
    });
}


/*
 The function filters an array of words to only get those 
 words that contain a specific emotion
*/
function filterByEmotion(emotion, text) {
    var ewords = text.filter(function(i) {
        return Object.keys(SENTIMENTS).indexOf(i) !== -1;
    });
    var fewords = ewords.filter(function(i) {
        return SENTIMENTS[i][emotion] === 1;
    })
    fewords = fewords.map(function(i) {
        return ' ' + i;
    })
    return fewords;
}


/*
 The function determines which words from an array have each emotion
 returning an object that contains that information.
*/
function ewordObj(text) {
    var ewordo = EMOTIONS.map(function(i) {
        return {
            'emotion': i,
            'ewords': filterByEmotion(i, text)
        };
    });
    return ewordo;
}


/*
 The function determines gets an array of the "most common" words 
 in an array, ordered by their frequency.
*/
function mostCommon(text) {
    var freq = text.reduce(function(p, c) {
        p[c] = (p[c] || 0) + 1;
        return p;
    }, []);
    //get the array of keys in the dictionary(tweet words)
    var key = Object.keys(freq);
    //sort the array in the descending order
    return key.sort(function compareFrequency(a, b) {
        return freq[b] - freq[a];
    });
}


/*
The function takes in one specific emotion and 
an array of tweets and returns an object containing 
the data of interest.
*/
function mostCommonHashtag(emotion, tweet) {
    var words = tweet.filter(function(i) {
        return i.entities.hashtags[0] !== undefined
    });
    var wordsarr = words.map(function(i) {
        return {
            'hashtags': i.entities.hashtags,
            'frequency': ewordObj(longWords(splitText(i.text)))
        }
    });
    var b = [];
    for (var i = 0; i < wordsarr.length; i++) {
        var freq = wordsarr[i].frequency[EMOTIONS.indexOf(emotion)].ewords.length;
        var has = wordsarr[i].hashtags;
        for (var m = 0; m < freq; m++) {
            has.map(function(n) {
                b.push(' #' + n.text)
            })
        };
    };
    return b.slice(0, 3);
};


/*
The function takes in an array of tweets and returns an object containing 
the data of interest.
*/
function analyzeTweets(tweets) {
    //organize tweeter data for sentiment analaysis
    var text = tweets.map(function(i) {
        return longWords(splitText(i.text));
    })
    var e = [];
    text = text.forEach(function(i) {
        return i.forEach(function(n) {
            e.push(n)
        })
    });
    text = e;
    var ewordo = ewordObj(text);
    var dict = ewordo.sort(function compareFrequency(a, b) {
        return b.ewords.length - a.ewords.length
    })
    dict = dict.map(function(i) {
        i['percentage'] = (i.ewords.length * 100 / text.length).toFixed(2);
        i['topwords'] = mostCommon(i.ewords).slice(0, 3);
        i['hashtags'] = mostCommonHashtag(i.emotion, tweets);
        return i;
    })
    return dict;
}


//get reference from html file
var table = d3.select("#emotionsTable");
var searchButton = d3.select("#searchButton");


/*
the function takes a array of tweets and display the
table of analyzed data
*/
function showEmotionData(tweets) {
    var dict = analyzeTweets(tweets);
    dict.forEach(function(i) {
        var newRow = table.append('tr');
        var rowContent = ('<td>' + i.emotion + '</td>' + '<td>' + i.percentage + '%' + '</td>' + '<td>' + i.topwords + '</td>' + '<td>' + i.hashtags + '</td>')
        newRow.html(rowContent);
    })
}


//set the default table displayed on the web
showEmotionData(SAMPLE_TWEETS)


/*
The function takes in a Twitter username and analyze that 
data finally display the table
*/
function loadTweets(username) {
    d3.json('http://faculty.washington.edu/joelross/proxy/twitter/timeline/?screen_name=' + username, function(tweets) {
        showEmotionData(tweets)
    })
}


/*
 Allow the user to specify the username they want to analyze in 
 the web page's "search box", and have the analysis occur and display 
 when the user clicks the "search" button.
 */
searchButton.on('click', function(i) {
    table.html('');
    var value = document.getElementById('searchBox').value;
    loadTweets(value);
})