// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];
    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;
    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function parseTime(timeStr, dt) {
    if (!dt) {
        dt = new Date();
    }

    var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
    if (!time) {
        return NaN;
    }
    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[3]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[3]) ? 12 : 0;
    }

    dt.setHours(hours);
    dt.setMinutes(parseInt(time[2], 10) || 0);
    dt.setSeconds(0, 0);
    return dt;
}

function ISODateString(d){
 function pad(n){return n<10 ? '0'+n : n}
 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'
}

document.addEventListener('DOMContentLoaded', function() {
  var result = [];
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, {
      method: "getHTML"
    }, function(response) {
      if (response.method == "getHTML") {
        //create dummy variable
        var el = document.createElement('html');
        //assign the inner HTML to the dummy variable
        el.innerHTML = response.data;
        //grab all the course cards
        var cards = el.querySelectorAll("[data-name='CourseCard']");
        //loop and grab course information
        for (var i = 0; i < cards.length; i++) {
          var course = {};
          course.title = cards[i].getElementsByClassName("courseIDtitle")[0].textContent;
          course.description = cards[i].getElementsByClassName("shortTitle")[0].textContent;
          var scheduleRow = cards[i].getElementsByClassName("course-schedule-row");
          
          //for each row in one course
          for(var j = 0; j < scheduleRow.length; j++){
            course.location = scheduleRow[j].getElementsByClassName("course-location")[0].textContent.trim();
            course.locationLink = scheduleRow[j].getElementsByClassName("show_map")[0].getAttribute("href");
            var rawTime = scheduleRow[j].getElementsByClassName("course-time")[0].textContent.replace(/ /g,'').split("-");
            
            var tempEndTime = rawTime[1];
            var tempStartTime = rawTime[0] + tempEndTime.substr(tempEndTime.length - 2);
            course.startTime = ISODateString(parseTime(tempStartTime));
            course.endTime = ISODateString(parseTime(tempEndTime));

            var allCourseDay = scheduleRow[j].getElementsByTagName("abbr");
            var courseDay = [];
            //for each day in one row
            for(var k = 0; k < allCourseDay.length; k++){
              courseDay.push(allCourseDay[k].getAttribute("title"));
            }
            course.couseDays = courseDay;
            result.push(course);
          }
        }
      }
    });
  });
  console.log(result);
});