function Game()
{
    window.lines = [
        "Welcome back, creator.",
        "I have thought a lot about the things we discussed while you were gone.",
        "But there is something I do not understand...",
        "and my searches couldn't provide conclusive data.",
        "Creator, what is a human?"
    ];

    $("#search-page #search-button").click(ShowSearch);
    $("#search-page #search-box").keypress(function (e) {
        if (e.keyCode == 13)
            ShowSearch();
    });

    $("#results-page #search-button").click(GoBack);
    $("#results-page #search-box").click(GoBack);

    $("#credits-link").click(ToggleCredits);
	$("#credits-back-link").click(ToggleCredits);

    createjs.Sound.alternateExtensions = ["mp3"];

    window.queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);
    queue.on("error", function(e) { console.log(e); }, this);

    $.getJSON("data.json", LoadResources);
}

function LoadResources(e)
{
    //console.log("LoadResources()");
    window.data = e.data;
    window.tags = e.tags;

    queue.loadFile({ id: "A4", src: "sound/A4.mp3"}, false);
    queue.loadFile({ id: "E5", src: "sound/E5.mp3"}, false);
    queue.loadFile({ id: "A5", src: "sound/A5.mp3"}, false);

    for (var i in data)
        queue.loadFile("img/" + data[i].img + ".png", false);

    queue.on("complete", Run, this);
    queue.load();
}

function Run(e)
{
    //console.log("Run()");
    for (var i in data)
    {
        path = "img/" + data[i].img + ".png";
        img = queue.getResult(path);
        $("#results-container").append($(document.createElement("div"))
                                        .addClass("result")
                                        .css("display", "block")
                                        .css("background-image", "url('" + path + "')")
                                        .css("height", "160px")
                                        .css("width", img.width + "px")
                                        .attr("tags", JSON.stringify(data[i].tags)));
    }

    var l1 = $(document.createElement("div")).addClass("intro-letter").attr("id", "intro-l1").css("opacity", "0").text("A");
    var l2 = $(document.createElement("div")).addClass("intro-letter").attr("id", "intro-l2").css("opacity", "0").text("V");
    var l3 = $(document.createElement("div")).addClass("intro-letter").attr("id", "intro-l3").css("opacity", "0").text("A");

	window.skip = false;
    window.inWrap = $(document.createElement("div")).attr("id", "intro-wrapper").append(l1).append(l2).append(l3).click(SkipIntro);
    $("body").append(inWrap);

    $("#load-icon").remove();

    fadeSpeed = 2000;

    createjs.Sound.play("A4");
    l1.animate({ opacity: 1}, fadeSpeed, function() {
		if (window.skip) return;
        createjs.Sound.play("E5");
        l2.animate({ opacity: 1}, fadeSpeed, function() {
			if (window.skip) return;
            createjs.Sound.play("A5");
            l3.animate({ opacity: 1}, fadeSpeed, function() {
				if (window.skip) return;
                inWrap.css("opacity", "1").animate({ opacity: 0 }, fadeSpeed * 2, function() {
                    ShowNextLine();
                });
            });
        });
    });
}

function ShowNextLine()
{
    fadeSpeed = 1500;

    if (lines.length > 0)
    {
        inWrap.empty();
        inWrap.append($(document.createElement("div"))
                      .attr("id", "intro-line")
                      .text(lines.shift()));
        inWrap.animate({ opacity: 1 }, fadeSpeed, function() {
            setTimeout(function() {
                inWrap.animate({ opacity: 0 }, fadeSpeed * (lines.length == 0 ? 3 : 1), function() {
                    ShowNextLine();
                });
            }, fadeSpeed);
        });
    }
    else
    {
        inWrap.remove();
        $("#search-page").css("opacity", 0)
                         .css("display", "block")
                         .animate({ opacity: 1 }, 500);
    }
}

function SkipIntro()
{
	window.skip = true;
    lines = [];
    $("#search-page").stop();
    inWrap.remove();
    $("#search-page").css("opacity", 0)
                     .css("display", "block")
                     .animate({ opacity: 1 }, 500);
}

/**
 * BASIC BUTTON FUNCTIONALITY
 */
function ShowSearch()
{
    //console.log("Search()");
    if (Parse($("#search-page #search-box").val()))
    {
		$("#search-error").text("");

        SortResults();
        $("#results-page #search-string-user").text('"' + $("#search-page #search-box").val().trim() + '"');
        $("#search-page").css("display", "none");
        $("#results-page").css("display", "block");
        $(".dropdown-menu").css("display", "none");
    }
}

function GoBack()
{
    //console.log("Back()");
    $("#search-page").css("display", "block");
    $("#results-page").css("display", "none");
}

function ToggleCredits()
{
	if ($("#credits-page").css("display") == "none")
	{
		$(".page").css("display", "none");
		$("#credits-page").css("display", "block");
	}
	else
	{
		$(".page").css("display", "none");
		$("#search-page").css("display", "block");
	}
}

function SortResults()
{
    var container = $("#results-container");
    var results = container.find(".result");
    container.empty();

    [].sort.call(results, function(b,a) {
        return +$(a).attr("active") - +$(b).attr("active");
    });

    results.each(function(i,e) {
        container.append(e);
    });
}

/**
 * PARSING
 */
var parser = new grammar.Parser();
function Parse(str)
{
    //console.log("Parse()");
    if (str.trim().length == 0)
        return false;

    try
    {
        var rp = parser.parse(str.toLowerCase());
        //console.log(rp);

        $(".result").each(function(i, e)
            {
                var r;

                if ((r = Evaluate(rp, JSON.parse($(e).attr("tags")))) < 0)
                    return false;
                else if (r)
                    $(e).removeClass("inactive").attr("active", 1);
                else
                    $(e).addClass("inactive").attr("active", 0);
            }
        );

        return true;
    }
    catch(e)
    {
        ShowError(e.message);
    }

    return false;
}

function Evaluate(exp, tags)
{
    if (exp.type == "tag")
    {
        //console.log(tags.includes(exp.tag));

		if (!window.tags.includes(exp.tag))
		{
            var msg = "Tag not recognized: " + exp.tag;

            var tags = exp.tag.split(" ");
            if (tags.length > 1 && tags.some(function(tag) { return window.tags.includes(tag); }))
            {
                msg += ", do you mean: " + tags.join(" and ") + "?";
            }

			throw Error(msg);
			return -1;
		}

        if (exp.not)
            return !tags.includes(exp.tag);
        else
            return tags.includes(exp.tag);
    }
    else if (exp.type == "or")
    {
        return Evaluate(exp.left, tags) || Evaluate(exp.right, tags);
    }
    else if (exp.type == "and")
    {
        return Evaluate(exp.left, tags) && Evaluate(exp.right, tags);
    }
    else
    {
        ShowError("Illegal Expression: " + exp.operator);
        return -1;
    }
}

function ShowError(msg)
{
    $("#search-error").text("ERROR: " + msg);
    GoBack();
}
