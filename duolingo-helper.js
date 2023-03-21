// ==UserScript==
// @name                Duolingo helper
// @namespace           Violentmonkey Scripts
// @homepageURL         https://github.com/alexlogvin/browser-userscripts/blob/main/duolingo-helper.js
// @supportURL          https://github.com/alexlogvin/browser-userscripts/issues
// @contributionURL     https://paypal.me/AlexLogvin
// @contributionAmount  $1.00
// @author              alexlogvin
// @copyright           alexlogvin
// @license             MIT
// @match               https://www.duolingo.com/learn*
// @match               https://www.duolingo.com/alphabet*
// @match               https://www.duolingo.com/checkpoint*
// @match               https://www.duolingo.com/stories*
// @match               https://www.duolingo.com/practice*
// @match               https://www.duolingo.com/lesson*
// @grant               none
// @version             1.0
// @description         Helps with Duolingo lessons
// @icon                https://www.google.com/s2/favicons?sz=64&domain=duolingo.com
// @run-at              document-end
// ==/UserScript==



const DEBUG = true;
let mainInterval;
const dataTestComponentClassName = "e4VJZ";
const TIME_OUT = 1000;

// Challenge types
const CHARACTER_SELECT_TYPE = "characterSelect";
const CHARACTER_MATCH_TYPE = "characterMatch";
const TRANSLATE_TYPE = "translate";
const LISTEN_TAP_TYPE = "listenTap";
const NAME_TYPE = "name";
const COMPLETE_REVERSE_TRANSLATION_TYPE = "completeReverseTranslation";
const PARTIAL_REVERSE_TRANSLATION_TYPE = "partialReverseTranslate";
const LISTEN_TYPE = "listen";
const SELECT_TYPE = "select";
const JUDGE_TYPE = "judge";
const FORM_TYPE = "form";
const LISTEN_COMPREHENSION_TYPE = "listenComprehension";
const READ_COMPREHENSION_TYPE = "readComprehension";
const CHARACTER_INTRO_TYPE = "characterIntro";
const DIALOGUE_TYPE = "dialogue";
const SELECT_TRANSCRIPTION_TYPE = "selectTranscription";
const SPEAK_TYPE = "speak";
const SELECT_PRONUNCIATION_TYPE = "selectPronunciation";
const LISTEN_ISOLATION_TYPE = "listenIsolation";

// W.I.P
const ASSIST_TYPE = "assist";
const TAP_COMPLETE_TYPE = "tapComplete";
const GAP_FILL_TYPE = "gapFill";
const CHARACTER_TRACE_TYPE = "characterTrace";
const CHALLENGE_PUZZLE_TYPE = "characterPuzzle";
const DEFINITION_TYPE = "definition";
const MATCH_TYPE = "match";
const TAP_DESCRIBE_TYPE = "tapDescribe";
const FREE_RESPONSE_TYPE = "freeResponse";

// Query DOM keys
const CHALLENGE_CHOICE_CARD = '[data-test="challenge-choice-card"]';
const CHALLENGE_CHOICE = '[data-test="challenge-choice"]';
const CHALLENGE_ASSIST = '[data-test="challenge challenge-assist"]';
const CHALLENGE_TRANSLATE_INPUT = '[data-test="challenge-translate-input"]';
const CHALLENGE_TRANSLATE = '[data-test="challenge challenge-translate"]';
const CHALLENGE_LISTEN_TAP = '[data-test="challenge-listenTap"]';
const CHALLENGE_JUDGE_TEXT = '[data-test="challenge-judge-text"]';
const CHALLENGE_TEXT_INPUT = '[data-test="challenge-text-input"]';
const CHALLENGE_TAP_TOKEN = 'button[data-test*="challenge-tap-token"]';
// const CHALLENGE_TAP_TOKEN = '[data-test="challenge challenge-match"]';
const CHALLENGE_TAP_TOKEN_TEXT = '[data-test="challenge-tap-token-text"]';
const PLAYER_NEXT = '[data-test="player-next"]';
const PLAYER_SKIP = '[data-test="player-skip"]';
const AUDIO_BUTTON = '[data-test="audio-button"]';
const WORD_BANK = '[data-test="word-bank"]';
const BLAME_INCORRECT = '[data-test="blame blame-incorrect"]';
// const CHARACTER_MATCH = '[data-test="challenge challenge-characterMatch"]';
const CHARACTER_MATCH = '[data-test="challenge challenge-match"]';
const STORIES_PLAYER_NEXT = '[data-test="stories-player-continue"]';
const STORIES_CHOICE = '[data-test="stories-choice"]';
const STORIES_ELEMENT = '[data-test="stories-element"]';

// Mouse Click
const clickEvent = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
});

// Gets Challenge Object
function getChallengeObj(theObject) {
    let result = null;
    if (theObject instanceof Array) {
        for (let i = 0; i < theObject.length; i++) {
            result = getChallengeObj(theObject[i]);
            if (result) {
                break;
            }
        }
    } else {
        for (let prop in theObject) {
            if (prop == "challenge") {
                if (typeof theObject[prop] == "object") {
                    return theObject;
                }
            }
            if (
                theObject[prop] instanceof Object ||
                theObject[prop] instanceof Array
            ) {
                result = getChallengeObj(theObject[prop]);
                if (result) {
                    break;
                }
            }
        }
    }
    return result;
}

// Gets the Challenge
function getChallenge() {
    const dataTestDOM = document.getElementsByClassName(dataTestComponentClassName)[0] ??
                        document.getElementsByClassName("FQpeZ")[0] ??
                        document.getElementsByClassName("WzuSM")[0] ??
                        document.getElementsByClassName("xzblA")[0];

    if (!dataTestDOM) {
        document.querySelectorAll(PLAYER_NEXT)[0].dispatchEvent(clickEvent);
        return null;
    } else {
        const dataTestAtrr = Object.keys(dataTestDOM).filter(att => /^__reactProps/g.test(att))[0];
        const childDataTestProps = dataTestDOM[dataTestAtrr];
        const { challenge } = getChallengeObj(childDataTestProps);
        return challenge;
    }
}

// Calls clickEvent()
function pressEnter() {
    const clickEvent = new MouseEvent("click", {
        "view": window,
        "bubbles": true,
        "cancelable": false,
    });

    // Press the Next/Continue button automatically
    document.querySelector('button[data-test="player-next"]').dispatchEvent(clickEvent);
}

// pressEnter() function but for stories
function pressEnterStories() {
    const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: false,
    });
    document
        .querySelector('button[data-test="stories-player-continue"]')
        .dispatchEvent(clickEvent);
}

function dynamicInput(element, msg) {
    let input = element;

    if (input.nodeName == "SPAN") {
        input.innerText = msg;
    } else {
        let lastValue = input.value;
        input.value = msg;
        let event = new Event("input", { bubbles: true });
        event.simulated = true;
        let tracker = input._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        input.dispatchEvent(event);
    }
}

// Solves the Challenge
function classify() {
    const challenge = getChallenge();
    if (!challenge) return;
    if (DEBUG) console.log(`${challenge.type}`, challenge);
    switch (challenge.type) {
        case GAP_FILL_TYPE:
        case SELECT_TYPE:
        case SELECT_PRONUNCIATION_TYPE:
        case READ_COMPREHENSION_TYPE:
        case LISTEN_COMPREHENSION_TYPE:
        case CHARACTER_SELECT_TYPE:
        case ASSIST_TYPE:
        case FORM_TYPE: {
            const { choices, correctIndex } = challenge;

            if (DEBUG)
                console.log('READ_COMPREHENSION, LISTEN_COMPREHENSION, CHARACTER_SELECT_TYPE, GAP_FILL_TYPE, SELECT_PRONUNCIATION_TYPE', { choices, correctIndex });

            document.querySelectorAll(CHALLENGE_CHOICE)[correctIndex].dispatchEvent(clickEvent);
            return { choices, correctIndex };
        }

        case TAP_COMPLETE_TYPE: {
            const { choices, correctIndices } = challenge;
            const tokens = document.querySelectorAll(WORD_BANK + " " + CHALLENGE_TAP_TOKEN);
            if (DEBUG) { console.log("TAP_COMPLETE_TYPE", { choices, correctIndices, tokens }); }
            correctIndices.forEach((e, i) => {
                tokens[e].dispatchEvent(clickEvent);
            });
            return { choices, correctIndices };
        }

        case LISTEN_ISOLATION_TYPE: {
            const { correctIndex } = challenge;
            const tokens = document.querySelectorAll(CHALLENGE_CHOICE);
            if (DEBUG) { console.log("LISTEN_ISOLATION_TYPE", { correctIndex, tokens }); }
            tokens.forEach((e, i) => {
                if (i == correctIndex) {
                    e.dispatchEvent(clickEvent);
                }
            });
            return { correctIndex };
        }

        case MATCH_TYPE: {
            const { pairs } = challenge;
            const tokens = document.querySelectorAll(CHALLENGE_TAP_TOKEN_TEXT);
            if (DEBUG) { console.log("CHARACTER_MATCH_TYPE", { tokens, pairs }); }
            pairs.forEach((pair) => {
                for (let i = 0; i < tokens.length; i++) {
                    if (
                        tokens[i].innerText === pair.fromToken ||
                        tokens[i].innerText === pair.learningToken
                    ) {
                        tokens[i].dispatchEvent(clickEvent);
                    }
                }
            });
            return { pairs };
        }

        case CHARACTER_MATCH_TYPE: {
            const { pairs } = challenge;
            const tokens = document.querySelectorAll(CHALLENGE_TAP_TOKEN);
            if (DEBUG) { console.log("CHARACTER_MATCH_TYPE", { tokens, pairs }); }
            pairs.forEach((pair) => {
                for (let i = 0; i < tokens.length; i++) {
                    if (
                        tokens[i].innerText === pair.transliteration ||
                        tokens[i].innerText === pair.character
                    ) {
                        tokens[i].dispatchEvent(clickEvent);
                    }
                }
            });
            return { pairs };
        }

        case TRANSLATE_TYPE: {
            const { correctTokens, correctSolutions } = challenge;
            if (DEBUG) { console.log("TRANSLATE_TYPE", { correctTokens, correctSolutions }); }
            if (correctTokens) {
                const tokens = document.querySelectorAll(CHALLENGE_TAP_TOKEN);
                let ignoreTokeIndexes = [];
                for (let correctTokenIndex in correctTokens) {
                    for (let tokenIndex in tokens) {
                        const token = tokens[tokenIndex];
                        if (ignoreTokeIndexes.includes(tokenIndex)) continue;
                        if (token.innerText === correctTokens[correctTokenIndex]) {
                            token.dispatchEvent(clickEvent);
                            ignoreTokeIndexes.push(tokenIndex);
                            if (DEBUG) {
                                console.log(`correctTokenIndex [${correctTokens[correctTokenIndex]}] - tokenIndex [${token.innerText}]`);
                            }
                            break;
                        }
                    }
                }
            } else if (correctSolutions) {
                let textInputElement = document.querySelectorAll(CHALLENGE_TRANSLATE_INPUT)[0];
                dynamicInput(textInputElement, correctSolutions[0]);
            }

            return { correctTokens };
        }

        case NAME_TYPE: {
            const { correctSolutions } = challenge;
            if (DEBUG) console.log('NAME_TYPE', { correctSolutions });
            let textInputElement = document.querySelectorAll(CHALLENGE_TEXT_INPUT)[0];
            let correctSolution = correctSolutions[0];
            if (challenge.articles?.length > 0) {
                let article, articleIndex;
                for (articleIndex in challenge.articles) {
                    article = challenge.articles[articleIndex];
                    if (correctSolution.startsWith(article))
                      break;
                }

                document.querySelectorAll(CHALLENGE_CHOICE)[articleIndex].dispatchEvent(clickEvent);

                correctSolution = correctSolution.substring(article.length);
            }
            dynamicInput(textInputElement, correctSolution);
            return { correctSolutions };
        }

        case COMPLETE_REVERSE_TRANSLATION_TYPE: {
            const { displayTokens } = challenge;
            if (DEBUG) { console.log("COMPLETE_REVERSE_TRANLATION_TYPE", { displayTokens }); }
            const { text } = displayTokens.filter((token) => token.isBlank)[0];
            let textInputElement = document.querySelectorAll(CHALLENGE_TEXT_INPUT)[0];
            dynamicInput(textInputElement, text);
            return { displayTokens };
        }

        case PARTIAL_REVERSE_TRANSLATION_TYPE: {
            const { displayTokens } = challenge;
            if (DEBUG) { console.log("COMPLETE_REVERSE_TRANLATION_TYPE", { displayTokens }); }
            let text = displayTokens.filter((token) => token.isBlank).map(x => x.text).join("");
            let itemQuery = "[data-test='challenge challenge-partialReverseTranslate'] ._1eYfv._29omP";
            let textInputElement = document.querySelectorAll(itemQuery)[0];

            dynamicInput(textInputElement, text);
            textInputElement.dispatchEvent(new Event('input', { bubbles: true}))
            textInputElement.dispatchEvent(new Event('change', { bubbles: true}))

            return { displayTokens };
        }

        case LISTEN_TAP_TYPE: {
            const { correctTokens } = challenge;
            if (DEBUG) { console.log("LISTEN_TAP_TYPE", { correctTokens }); }
            const tokens = document.querySelectorAll(CHALLENGE_TAP_TOKEN);
            for (let wordIndex in correctTokens) {
                tokens.forEach((token) => {
                    if (token.innerText === correctTokens[wordIndex]) {
                        token.dispatchEvent(clickEvent);
                    }
                });
            }
            return { correctTokens };
        }

        case LISTEN_TYPE: {
            const { prompt } = challenge;
            if (DEBUG) console.log('LISTEN_TYPE', { prompt });
            let textInputElement = document.querySelectorAll(CHALLENGE_TRANSLATE_INPUT)[0];
            dynamicInput(textInputElement, prompt);
            return { prompt };
        }

        case JUDGE_TYPE: {
            const { correctIndices } = challenge;
            if (DEBUG) console.log('JUDGE_TYPE', { correctIndices });
            document.querySelectorAll(CHALLENGE_JUDGE_TEXT)[correctIndices[0]].dispatchEvent(clickEvent);
            return { correctIndices };
        }

        case DIALOGUE_TYPE:
        case CHARACTER_INTRO_TYPE: {
            const { choices, correctIndex } = challenge;
            if (DEBUG) console.log('CHARACTER_INTRO_TYPE, DIALOGUE_TYPE', { choices, correctIndex });
            document.querySelectorAll(CHALLENGE_JUDGE_TEXT)[correctIndex].dispatchEvent(clickEvent);
            return { choices, correctIndex };
        }

        case SELECT_TRANSCRIPTION_TYPE: {
            const { choices, correctIndex } = challenge;
            if (DEBUG) console.log('SELECT_TRANSCRIPTION_TYPE', { choices, correctIndex });
            document.querySelectorAll(CHALLENGE_JUDGE_TEXT)[correctIndex].dispatchEvent(clickEvent);
            return { choices, correctIndex };
        }

        case SPEAK_TYPE: {
            const { prompt } = challenge;
            if (DEBUG) { console.log("SPEAK_TYPE", { prompt }); }
            document.querySelectorAll(PLAYER_SKIP)[0].dispatchEvent(clickEvent);
            return { prompt };
        }

        case ASSIST_TYPE: {
            const { choices, correctIndex } = challenge;
            if (DEBUG) { console.log("ASSIST_TYPE", { choices, correctIndex }); }
            document.querySelectorAll(CHALLENGE_JUDGE_TEXT)[correctIndex].dispatchEvent(clickEvent);
            return { choices, correctIndex };
        }

        default:
            break;
    }
}

// Stops when an answer is incorrect
function breakWhenIncorrect() {
    const isBreak = document.querySelectorAll(BLAME_INCORRECT).length > 0;
    if (isBreak) {
        console.log("Incorrect, stopped");
        clearInterval(mainInterval);
    }
}

// Main Function
function main() {
    try {
        let isPlayerNext = document.querySelectorAll(PLAYER_NEXT)[0].textContent.toUpperCase();
        if (isPlayerNext.valueOf() !== "CONTINUE") {
            classify();
            breakWhenIncorrect();
            pressEnter();
        }
        setTimeout(pressEnter, 150);
    } catch (e) {
        console.log(e);
    }
}

// Stories Function
function stories() {
    try {
        let isPlayerNext = document.querySelectorAll(STORIES_PLAYER_NEXT)[0];
        if (isPlayerNext != undefined) {
            classify();
        }
        setTimeout(pressEnterStories, 50);
    } catch (e) {
        pressEnterStories();
        console.log(e);
    }
}

// Calls main()
async function solveChallenge() {
    await new Promise(r => setTimeout(r, 5000));

    // Check if it's a Story
    let startStoryBtn = document.querySelectorAll('[data-test="story-start"]')[0];
    if (startStoryBtn != undefined) {
        if (DEBUG) { console.log("Story Detected"); }
        startStoryBtn.dispatchEvent(clickEvent);
        mainInterval = setInterval(stories, TIME_OUT);
    }
    //it's a lesson
    else {
        if (DEBUG) { console.log("Lesson Detected"); }
        mainInterval = setInterval(main, TIME_OUT);
    }
    console.log(`to stop the script run "clearInterval(${mainInterval})"`);
}

(solveChallenge)();
1
