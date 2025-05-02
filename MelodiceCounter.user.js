// ==UserScript==
// @name         Melodice Counter
// @namespace    http://tampermonkey.net/
// @version      2025-05-02
// @description  try to take over the world!
// @author       You
// @match        https://melodice.org
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    function setSongCount(songs, index) {
        setTimeout(() => {
            const allSuggestions = document.querySelectorAll('.ui-menu-item a');
            const suggestionElement = document.querySelectorAll('.ui-menu-item a')[index];
            if (suggestionElement) {
                suggestionElement.textContent = `${suggestionElement.textContent} --- ${songs}`;
            }
        });

    }

    function handleSuggestions(suggestionsArray) {
        suggestionsArray.forEach((item, index) => {
            const songs = localStorage.getItem(item.id);
            console.log(`got ${songs} from localStorage`);
            if (songs) {
                setSongCount(songs, index);
            } else {
                // assume item has a "url" property
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://melodice.org/playlist/${item.id}/`,
                    onload: function(response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, "text/html");

                        // extract data from loaded page
                        const regex = /\d+ song/
                        const dataContainingText = doc.querySelector('#wrapper > div.content-wrapper > div > div > div > div.col-md-7.col-player > div.box.box-padding > p').textContent
                        const songs = +dataContainingText.match(regex)[0].split(' ')[0]

                        localStorage.setItem(item.id, songs);
                        setSongCount(songs, index);
                    }
                });
            }
        });
    }

    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this.status === 200) {
                if (this.responseURL.includes('api/autocomplete/')) { // ← Update this
                    try {
                        const data = JSON.parse(this.responseText);
                        handleSuggestions(data);
                    } catch (e) {
                        console.error('Failed to parse suggestions:', e);
                    }
                }
            }
        });

        return originalSend.apply(this, args);
    };
})();
