var http = require('http');
var fs = require('fs');
var request = require('request');
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

http.createServer(function (req, res) {
    var url = req.url;
  console.log(url);
  url = replaceAll(url, "%3A", ":");
  url = replaceAll(url, "%2520", " ");
	   if (url.length == 1)
	   {
		    var page = fs.readFileSync("baseFiles/index.html", 'utf-8');    
        res.write(page);
        res.end();
	   }  
  else if(url.includes("apiCall")){
    //apiCall:getData?Trubisky 69 420
    //apiCall:getPopularChamps?encryptedID
    let command = url.split(":")[1].split("?")[0];
    
    if (command == "getData"){
       let summonerName = url.split("?")[1];
      request("https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + summonerName + "?api_key=" + process.env.TOKEN, function(err, resp, bod){
        bod = JSON.parse(bod);
        let final = {id: bod["id"], level: bod["summonerLevel"], icon: bod["profileIconId"], accId: bod["accountId"]};
        res.write(JSON.stringify(final));
        res.end();
      });
    }
    else if(command == "getPopularChamps"){
      let encryptedId = url.split("?")[1];
       request("https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/" + encryptedId + "?api_key=" + process.env.TOKEN, function(err, resp, bod){
           bod = JSON.parse(bod);
           let re = [];
           for (let i=0; i<5; i++){
             re.push(bod[i]["championId"]);
           }
           res.write(JSON.stringify(re));
           res.end();
       });
    }
    else if(command == "getRanked"){
      let encryptedId = url.split("?")[1];
      let compiledString = "Unranked";
        request("https://na1.api.riotgames.com/lol/league/v4/positions/by-summoner/" + encryptedId + "?api_key=" + process.env.TOKEN, function(err, resp, bod){
          bod = JSON.parse(bod);
          console.log(bod);
          for (var item of bod){
            if (item["queueType"] == "RANKED_SOLO_5x5"){
              var rWinRate = Math.round(item["wins"] / (item["wins"] + item["losses"])*100);
              compiledString = item["tier"] + " " + item["rank"] + ", " + item["leaguePoints"] + " LP, " + rWinRate + "% WR";  
              break;
            }
          }
          res.write(compiledString);
          res.end();
        });
    }
    else if(command == "getMatches"){
      let encryptedId = url.split("?")[1];
      request("https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/" + encryptedId + "?api_key=" + process.env.TOKEN, function(err, resp, bod){
        bod = JSON.parse(bod);
        let finalArray = [];
        for (let i=0; i<10; i++){
          let nObject = {};
          nObject["lane"] = bod["matches"][i]["lane"];
          nObject["champion"] = bod["matches"][i]["champion"];
          nObject["gameId"] = bod["matches"][i]["gameId"];
          finalArray.push(nObject);
        }
        res.write(JSON.stringify(finalArray));
        res.end();
      });
    }
    else if(command == "getMatch"){
      let matchId = url.split("?")[1];
      let sumName = url.split("?")[2];
      sumName = replaceAll(sumName, "%20", " ")
      let storedID = 0;
      let nameChamp = [];
      request("https://na1.api.riotgames.com/lol/match/v4/matches/" + matchId + "?api_key=" + process.env.TOKEN, function(err, resp, bod){
        bod = JSON.parse(bod);
        for (var i=0; i<10; i++){
          let nArray = [];
          nArray[0] = bod["participantIdentities"][i]["player"]["summonerName"];
          if (nArray[0].toLowerCase() == sumName.toLowerCase()){
            storedID = i;
          }
          nArray[1] = bod["participants"][i]["championId"];
          nameChamp.push(nArray);
        }
        console.log('storedid: ' + storedID);
        res.write(JSON.stringify([nameChamp, bod["participants"][storedID]]));
        res.end();
      });
    }
  }
    else if(!url.includes("favicon")){
        url = replaceAll(url, "%20", " ");
        var page = fs.readFileSync("baseFiles/profile.html", 'utf-8');
        page = replaceAll(page, "SUMMONERNAME", url.substring(1));
        res.write(page);
        res.end();
    }
    
}).listen(process.env.PORT); 

