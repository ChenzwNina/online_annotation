const fs = require('fs');
// read and include .env file
require('dotenv').config();

const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer '+ process.env.AUTH }
};

fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT}/storage/kv/namespaces/${process.env.NAMESPACE}/keys?limit=1000`, options)
    .then(response => response.json())
    .then(async response => {
        // write the response to the file system
        let result = response;
        fs.writeFileSync('response.json', JSON.stringify(result), 'utf-8');
        if (result.result_info.cursor.length != 0) {
            console.log('There are more keys to fetch');
        }
        await getAllKeyValues(result.result);
        await main();
    }
    )
    .catch(err => console.error(err));

async function getAllKeyValues(source) {
    let ratingInfo = {};
    let ratings = source;
    let comments = {};
    for (let i = 0; i < ratings.length; i++) {
        if (!('metadata' in ratings[i])) {
            let r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT}/storage/kv/namespaces/${process.env.NAMESPACE}/values/` + ratings[i].name, options)
            r = await r.json();
            console.log(r);
            comments[ratings[i].name] = r;
            continue;
        }
        let rater = ratings[i].metadata.rater;
        let toAdd = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT}/storage/kv/namespaces/${process.env.NAMESPACE}/values/` + ratings[i].name, options)).json();
        if (ratingInfo[rater] != undefined) {
            if (ratings[i].metadata.index in ratingInfo[rater]) {
                ratingInfo[rater][ratings[i].metadata.index].push(toAdd);
            } else {
                ratingInfo[rater][ratings[i].metadata.index] = [toAdd];
            }
        } else {
            ratingInfo[rater] = { [ratings[i].metadata.index]: [toAdd] };
            console.log(ratingInfo[rater]);
        }
    }
    // sort all ratingInfo[rater][ratings[i].metadata.index] by the time it was rated
    for (let key in ratingInfo) {
        for (let index in ratingInfo[key]) {
            ratingInfo[key][index] = ratingInfo[key][index].sort((a, b) => b.time - a.time);
            // convert all time to date
            for (let i = 0; i < ratingInfo[key][index].length; i++) {
                ratingInfo[key][index][i]["dateTime"] = new Date(ratingInfo[key][index][i].time);
            }
        }
    }
    // write comments to file
    fs.writeFileSync('comments.json', JSON.stringify(comments), 'utf-8');
    // write ratingInfo to file
    fs.writeFileSync('ratingInfo.json', JSON.stringify(ratingInfo), 'utf-8');
    return;
}

function getRatingINfo(source) {
    let ratingInfo = {};
    let ratings = source;
    for (let i = 0; i < ratings.length; i++) {
        if (!('metadata' in ratings[i])) {
            continue;
        }
        let rater = ratings[i].metadata.rater;
        if (rater in ratingInfo) {
            ratingInfo[rater].push(ratings[i].metadata.index);
        } else {
            ratingInfo[rater] = [ratings[i].metadata.index];
        }
    }
    // convert all elements inside the array to int and sort
    for (let key in ratingInfo) {
        ratingInfo[key] = ratingInfo[key].map((val) => parseInt(val)).sort((a, b) => a - b);
    }
    return ratingInfo;
}

function getFinalRating() {
    // read from ratingInfo.json
    let data = JSON.parse(fs.readFileSync('ratingInfo.json', 'utf-8'));
    let result = {};
    for(let i of Object.keys(data)) {
        for(let j of Object.keys(data[i])) {
            result[parseInt(j)] = data[i][j][0];
        }
    }
    return result;
}

function fillinSeed(source){
    // read from selectedSeed.json
    let data = JSON.parse(fs.readFileSync('selectedSeed.json', 'utf-8'));
    for(let i of Object.keys(source)) {
        data[parseInt(i)]["rating"] = source[i];
    }
    // write to selectedSeed.json
    fs.writeFileSync('selectedSeed.json', JSON.stringify(data), 'utf-8');
}

async function main() {
    // read from response.json
    // let data = fs.readFileSync('response.json', 'utf-8');
    // let response = JSON.parse(data);
    // let keys = response.result;
    // await getAllKeyValues(keys);
    fillinSeed(getFinalRating());
    // console.log(getRatingINfo(keys));
    console.log('Hello World');
}

// main();