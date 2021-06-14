
/**
 * This script contains functions to create and display fretboard diagrams
 * using diatonic scale degrees.
 *
 * Each scale degree is displayed with a unique color that can be toggled on
 * and off.
 */

run();

/**
 * Renders the page.
 */
async function run() {
    const currentNote = await api.originEntity;

    // Possible values: single, wideSingle, list1, list2, list3
    const noteType = currentNote.getLabel("fretboardType").value;

    // Check if this is being run as an included note (hide controls and title)
    if (get("#fretboard-page").parent().parent().parent().parent().hasClass("include-note-content")) {
        get("#fretboard-controls").css("display", "none");
        get("#fretboard-page").append('<style type="text/css"> .fretboard-title { display: none } </style>');
    }
    else {
        createEventListeners();
    }

    // Render fretboard(s)
    switch (noteType) {
        case "single":
        case "wideSingle":
            get("#fretboard-"+noteType).append( createFretboard(currentNote) );
            get("#fretboard-edit-open-editor").show();
            break;
        case "list1":
        case "list2":
        case "list3":
            var children = await currentNote.getChildNotes();
            for (let i = 0; i < children.length; i++) {
                get("#fretboard-"+noteType).append( createFretboard(children[i]) );
            }
            break;
        default:
            api.showMessage("Invalid noteType. Valid options: single, wideSingle, list1, list2, list3");
            return;
    }

    // Render notes on the fretboards
    createNotes("dots");
}


/**
 * Creates and returns a fretboard diagram element using information
 * provided by the given Trilium note.
 *
 * @param  {Note}      note   The Trilium note with relevant attributes
 * @return {jQuery}           A <div> containing a fretboard diagram
 */
function createFretboard(note) {

    // Check for diagram label
    if (!note.hasLabel("diagram")) {
        var noteType = note.getLabel("fretboardType").value;

        // If this note is supposed to have a single fretboard, add a blank one
        if(noteType == "single" || noteType == "wideSingle") {
           return createBlankFretboard(note);
        } else {
            //Otherwise, don't return anything
            return;
        }
    }

    // Extract data from note
    const title = note.title;
    const hasStartFret = note.hasLabel("startFret");
    const useZero = note.hasLabel("enableFretZero");
    const disableDegreeList = note.hasLabel("disableDegreeList");
    var stringDiagram = note.getLabel("diagram").value.split("|");

    // Remove leftover "|" character from diagram attribute
    stringDiagram.pop();

    for (let i = 0; i < stringDiagram.length; i++) {
        stringDiagram[i] = stringDiagram[i].split(",");
    }

    // Create fretboard container
    const fretboardElement = $("<div class='fretboard'></div>");
    fretboardElement.append("<div class='fretboard-title'>"+title+"</div>");

    // Create note list
    if (!disableDegreeList) {
        fretboardElement.append(makeNoteList(note.getLabel("diagram").value));
    }

    // Create fretboard diagram (table)
    const diagramElement = $("<table class='fretboard-diagram'></table>");
    fretboardElement.append(diagramElement);

    // Create guitar strings (table rows)
    for (let i = 0; i < stringDiagram.length; i++) {

        var string = $("<tr class='fretboard-string string-"+i+"'></tr>");

        // Create frets (table cells)
        for (let j = 0; j < stringDiagram[i].length; j++) {

            var fret = $("<td></td>");

            // Give appropriate class to fret depending on position
            switch (j) {
                case 0:
                    fret.addClass(useZero ? "fret open-fret" : "fret first-fret");
                    break;
                case 1:
                    fret.addClass(useZero ? "fret first-fret" : "fret");
                    break;
                case stringDiagram[i].length-1:
                    fret.addClass("fret last-fret");
                    break;
                default:
                    fret.addClass("fret");
                    break;
            }

            // Add note information to fret
            if (stringDiagram[i][j] != "-") {
                fret.addClass("fret-" + formatInterval(formatAccidental(stringDiagram[i][j])));
                fret.addClass("fret-note");
                fret.attr("note", formatAccidental(stringDiagram[i][j]));
            }

            string.append(fret);
        }
        diagramElement.append(string);
    }
    return fretboardElement;
}


/**
 * Returns a blank fretboard element.
 *
 * @param  {Note}      note   The Trilium note with relevant attributes
 * @return {jQuery}           A <div> containing a blank fretboard.
 */
function createBlankFretboard(note) {
    const fretboardElement = $("<div class='fretboard'></div>");
    fretboardElement.append("<div class='fretboard-title'>"+note.title+"</div>");
    fretboardElement.append("<div class='fretboard-degrees'></div>");

    const diagram = $("<table class='fretboard-diagram'></table>");
    fretboardElement.append(diagram);

    // Check for string and fret settings
    var stringCount = note.getLabel("defaultStringCount");
    var fretCount = note.getLabel("defaultFretCount");
    var useZero = note.hasLabel("enableFretZero");

    // Use default values if labels don't exist
    stringCount = (stringCount==null) ? 6 : stringCount.value;
    fretCount = (fretCount==null) ? 4 : fretCount.value;

    // Populate table
    for(let i = 0; i < stringCount; i++) {

        var string = $("<tr class='fretboard-string string-"+i+"'></tr>");

        for(let j = 0; j < fretCount; j++) {
            var fret = $("<td></td>");
            switch (j) {
                case 0:
                    fret.addClass(useZero ? "fret open-fret" : "fret first-fret");
                    break;
                case 1:
                    fret.addClass(useZero ? "fret first-fret" : "fret");
                    break;
                case fretCount-1:
                    fret.addClass("fret last-fret");
                    break;
                default:
                    fret.addClass("fret");
                    break;
            }
            string.append(fret);
        }
        diagram.append(string);
    }

    return fretboardElement;
}


/**
 * Iterates through every fret with a note and renders them in a particular
 * style: either a dot or with text.
 *
 * @param  {string}   mode   Either "dots" or "text"
 */
function createNotes(mode) {
    get(".fret-note").empty();

    if (mode == "dots") {
        get(".fret-note").append("<span class='bx bxs-circle fret-dots'></span>");
    } else {
        get(".fret-note").each( function() {
            $(this).append("<span class='fret-text'>" + $(this).attr("note")+ "</span>");
        });
    }
}


/**
 * Initiates edit mode. Assumes that this is being run on a single-fretboard
 * note.
 */
function editFretboard() {
    get(".fret").each(function() {
        $(this).empty();
        var value = $(this).attr("note");
        value = (value == undefined) ? "" : invertAccidental(value);
        $(this).append("<input class='fretboard-edit-fret' value='"+value+"''></input>");
    });
    get("#fretboard-button-mode").prop('disabled', true);
    get("#fretboard-edit-open-editor").hide();
    get("#fretboard-edit-save-changes").show();
    get("#fretboard-edit").show();
}


/**
 * Ends edit mode and updates the fretboard to reflect changes. Assumes that edit
 * mode is currently active.
 */
async function updateFretboard() {
    get("#fretboard-button-mode").prop('disabled', false);
    get("#fretboard-edit-open-editor").show();
    get("#fretboard-edit-save-changes").hide();
    get("#fretboard-edit").hide();

    // String that will store the #diagram attribute data
    var diagram = "";

    // Iterate through every fret, update accordingly
    get(".fret").each(function() {

        var value = $(this).children(".fretboard-edit-fret").val();
        if (value == "") {
            $(this).removeAttr("note");
            $(this).removeClass(function(index, className) {
                return (className.match(/(^|\s)fret-\S+/g) || []).join(' ');
            });
            diagram += "-" + ($(this).hasClass("last-fret") ? "|" : ",");
        }
        else {
            $(this).attr("note", value);
            $(this).addClass("fret-note fret-" + formatInterval(formatAccidental(value)));
            diagram += value + ($(this).hasClass("last-fret") ? "|" : ",");
        }
        $(this).empty();

    });

    // Re-draw notes
    createNotes(get("#fretboard-button-mode").attr("mode"));

    // Update note list
    get(".fretboard-degrees").replaceWith(makeNoteList(diagram));
    
    // Reflect changes in this note's attributes
    var noteId = api.originEntity.noteId;
    await api.runOnBackend(function(noteId, diagram) {
        api.getNote(noteId).setLabel("diagram", diagram);
    }, [noteId, diagram]);

}


// ----------------------------------------------------------------------------
//  HELPER FUNCTIONS
// ----------------------------------------------------------------------------


/**
 * Retrieve an element. By using this function instead of $() directly, it
 * guarantees that only elements within this render note are retrieved. This
 * allows the use of element IDs even though there may be multiple instances
 * of them.
 *
 * @param  {string}   element   Element selector (jQuery)
 * @return {jQuery}             Element
 */
function get(element) {
    return api.$container.find(element);
}


/**
 * Replaces '#' and 'b' with '♯' and '♭' respectively.
 *
 * @param  {string}   note   Scale degree. Ex: "#3" or "b5"
 * @return {string}          Formatted scale degree. Ex: "♯3" or "♭5"
 */
function formatAccidental(note) {
    note = note.replace(/[^sS#fFbB0-9]/g, '');
    note = note.replace(/[sS#]/g, '♯');
    note = note.replace(/[fFbB]/g, '♭');
    return note;
}


/**
 * Replaces '♯' and '♭' with '#' and 'b' respectively.
 *
 * @param  {string}   note   Scale degree. Ex: "♯3" or "♭5"
 * @return {string}          Formatted scale degree. Ex: "#3" or "b5"
 */
function invertAccidental(note) {
    note = note.replace(/[♯]/g, '#');
    note = note.replace(/[♭]/g, 'b');
    return note;
}


/**
 * Replaces the given interval with its octave equivalent.
 * Ex: '9' becomes '2', 'b11' becomes 'b4' ...
 *
 * @param  {string}   note   A scale degree. Ex: "3" or "f9"
 * @return {string}          Formatted  scale degree. Ex: "3" or "f2"
 */
function formatInterval(note) {
    var number = parseInt(note.match(/\d+/));
    number = (number%7==0) ? 7 : number%7;
    return note.match(/[^0-9]+/) + number;
}


/**
 * Enables or disables a scale degree's color.
 *
 * @param  {string}   degree   Scale degree
 * @param  {string}   status   Either "on" or "off"
 */
function toggleColor(degree, status) {
    var color;

    if (status == 0) {
        color = getComputedStyle(document.documentElement)
            .getPropertyValue('--fretboard-color-disabled');
        document.documentElement.style
            .setProperty('--fretboard-status-'+degree, 0);
    }
    else {
        color =  getComputedStyle(document.documentElement)
            .getPropertyValue('--fretboard-color-'+degree);
        document.documentElement.style
            .setProperty('--fretboard-status-'+degree, 1);
    }

    document.documentElement.style
        .setProperty('--fretboard-current-color-'+degree, color);
}



/**
 * Returns an element containing a list of scale degrees found within
 * the fretboard.
 *
 * @param  {string}   diagram   Data from the #diagram attribute
 * @return {jQuery}             A <div> containing a list of scale degrees
 */
function makeNoteList(diagram) {

    // Create an array containing every note in the fretboard
    var diagram = diagram.split("|");
    diagram.pop(); // to deal with trailing "|"

    for (let i = 0; i < diagram.length; i++) {
        diagram[i] = diagram[i].split(",");
    }

    diagram = [].concat(...diagram); // Combine 2D array into one

    // Format every note
    for (let i = 0; i < diagram.length; i++) {
        if (diagram[i] == "-") {
            diagram.splice(i, 1);
            i--;
        }
        else {
           diagram[i] = formatAccidental(diagram[i]);
        }
    }

    // Remove duplicates
    diagram = [...new Set(diagram)];
    
    // Sort array
    diagram.sort(sortDegree);

    // Create elements
    var noteList = $("<div class='fretboard-degrees'></div>");
    for (let i = 0; i < diagram.length; i++) {
        noteList.append("<span class='fretboard-degree-" +
           formatInterval(diagram[i]) + "'>" + diagram[i] + "</span>")
    }

    return noteList;
}


function sortDegree(a, b) {
    var numA = Number(a.match(/\d+/));
    var numB = Number(b.match(/\d+/));
    var accA = getValue(a.match(/[^0-9]+/));
    var accB = getValue(b.match(/[^0-9]+/));
    
    if (numA > numB) {
        return 1;
    } else if (numA < numB) {
        return -1;
    } else if (accA > accB) {
        return 1;
    } else if (accA < accB) {
        return -1;
    } else {
        return 0;
    }
}


function getValue(accidental) {
    if (accidental == null)
        return 3;
    else if (accidental == "♭")
        return 1;
    else if (accidental == "♯")
        return 4;
    else if (accidental == "♭♭")
        return 0;
    else
        return 5;
}


// ----------------------------------------------------------------------------
//  EVENT HANDLERS
// ----------------------------------------------------------------------------


/**
 * Attach click events to button elements. The HTML Trilium note doesn't seem
 * to have access to the functions directly, so this must be done instead.
 */
function createEventListeners() {
    get("#fretboard-button-toggle-1").click(buttonColorHandler);
    get("#fretboard-button-toggle-2").click(buttonColorHandler);
    get("#fretboard-button-toggle-3").click(buttonColorHandler);
    get("#fretboard-button-toggle-4").click(buttonColorHandler);
    get("#fretboard-button-toggle-5").click(buttonColorHandler);
    get("#fretboard-button-toggle-6").click(buttonColorHandler);
    get("#fretboard-button-toggle-7").click(buttonColorHandler);
    get("#fretboard-button-toggle-all").click(buttonColorHandler);
    get("#fretboard-button-toggle-none").click(buttonColorHandler);
    get("#fretboard-button-mode").click(buttonModeHandler);
    get("#fretboard-edit-open-editor").click(editFretboard);
    get("#fretboard-edit-save-changes").click(updateFretboard);
    get("#fretboard-edit-increase-fret").click(addFret);
    get("#fretboard-edit-decrease-fret").click(removeFret);
    get("#fretboard-edit-increase-string").click(addString);
    get("#fretboard-edit-decrease-string").click(removeString);
    get("#fretboard-edit-fret-zero").click(toggleFretZero);
}


/**
 * Enables or disables a degree color depending on which button was pressed.
 */
function buttonColorHandler() {

    // Character 24 is the numerical scale degree in the button ID.
    // For the 'toggle all' and 'toggle none' buttons, this is 'a' or 'n'.
    var degree = event.target.id[24];

    switch (degree) {
        case "a":
            for (let i = 1; i < 8; i++) {
                toggleColor(i, 1);
            }
            break;
        case "n":
            for (let i = 1; i < 8; i++) {
                toggleColor(i, 0);
            }
            break;
        default:
            var status = getComputedStyle(document.documentElement)
                .getPropertyValue('--fretboard-status-'+degree);
            toggleColor(degree, (status==1) ? 0 : 1);
            break;
    }

}


/**
 * Toggles between text and dot mode.
 */
function buttonModeHandler() {
    const modeButton = get("#fretboard-button-mode");

    if (modeButton.attr("mode") == "dots") {
        modeButton.attr("mode", "text");
        modeButton.text("Text");
        createNotes("text");
    }
    else {
        modeButton.attr("mode", "dots");
        modeButton.text("Dots");
        createNotes("dots");
    }
}

/**
 * Functions for adding or removing frets and strings in edit mode.
 */
function addFret() {
    var lastFrets = get(".last-fret");
    lastFrets.removeClass("last-fret");
    lastFrets.after("<td class='fret last-fret'><input class='fretboard-edit-fret' value=''></input></td>");
}

function removeFret() {
    if (get(".string-0").children().length > 2) {
        var lastFrets = get(".last-fret");
        lastFrets.prev().addClass("last-fret");
        lastFrets.remove();
    }
    else {
        api.showMessage("Minimum fret amount reached.");
    }
}

function addString() {
    var stringCount = get(".fretboard-string").length;
    var fretCount = get(".string-0").children().length;
    var useZero = api.originEntity.hasLabel("enableFretZero");
    
    var newString = $("<tr class='fretboard-string string-"+stringCount+"'></tr>");
    for (let i = 0; i < fretCount; i++) {
        var type;
        switch (i) {
            case 0:
                type = useZero ? "open-fret fret" : "first-fret fret";
                break;
            case 1:
                type = useZero ? "first-fret fret" : "fret";
                break;
            case fretCount-1:
                type = "last-fret fret";
                break;
        }
        newString.append("<td class='"+type+"'><input class='fretboard-edit-fret' value=''></input></td");
    }
    get(".fretboard-diagram").append(newString);
}


function removeString() {
    var stringCount = get(".fretboard-string").length;
    if (stringCount > 1)
        get(".string-"+(stringCount-1)).remove();
    else
        api.showMessage("Minimum of one string needed.");
}


async function toggleFretZero() {
    if (get(".open-fret").length < 1) {
        var firstFrets = get(".first-fret");
        firstFrets.removeClass("first-fret");
        firstFrets.addClass("open-fret");
        firstFrets.next().addClass("first-fret");
        await api.runOnBackend(function(noteId) {
            api.getNote(noteId).setLabel("enableFretZero");
        }, [api.originEntity.noteId]);
    }
    else {
        var openFrets = get(".open-fret");
        openFrets.removeClass("open-fret");
        get(".first-fret").removeClass("first-fret");
        openFrets.addClass("first-fret");
        await api.runOnBackend(function(noteId) {
            api.getNote(noteId).removeLabel("enableFretZero");
        }, [api.originEntity.noteId]);
    }
    
}