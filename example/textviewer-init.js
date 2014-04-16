var viewer;

$(document).ready(function() {
    // Gets content identifiers from the URL
    var hash = location.hash;
    var sections = Array();

    if (hash) {
        hash = hash.replace(/^#/, '');
        var parts = hash.split('/');
        var i = 0;

        $('.textSelection').each(function() {
            if (i < parts.length) {
                var subparts = parts[i].split(',');
                $(this).val(subparts[0]);

                if (subparts[1]) {
                    sections.push(subparts[0] + '/' + subparts[1]);
                }
            } else {
                sections.push('');
            }

            i++;
        });
    }

    // Content base URL
    var baseURL = location.href.split('facing')[0];

    // Initialises the textviewer
    viewer = new TextViewer('footer');
    $('.viewer-panel').each(function() {
        viewer.addPanel(baseURL, $(this).find('.textSelection'),
                        $(this).find('.viewer-text-box'), '');
    });
    viewer.setSwitch('commentary', true);
    viewer.setSwitch('collation', true);
    viewer.setSwitch('highlight', true);

    // Loads content passed in the URL
    for (var idx = 0; idx < sections.length; idx++) {
        if (sections[idx]) {
            viewer.panels[idx].loadSection(sections[idx]);
        }
    }

    // Function to expand a textviewer panel
    $('.expand').click(function(e) {
        var button = $(this);
        button.toggleClass('expanded');

        var expanded = button.hasClass('expanded');
        var panel = button.parents('.viewer-panel');
        if (expanded) {
            $(this).find('span').removeClass('icon-resize-full').addClass(
                'icon-resize-small');
            panel.css('width', '100%');
        } else {
            $(this).find('span').removeClass('icon-resize-small').addClass(
                'icon-resize-full');
            panel.css('width', '50%');
        }

        $('.viewer-panel').each(function() {
            $(this).toggle(! expanded || (panel[0] == this));
        });
    });

    // When the page first loads, expands the first panel
    $('.expand')[0].click();

    // Textviewer controls manager
    $('.ctrl').click(function(e) {
        $(this).parent().toggleClass('active');
        var id = $(this).attr('id');
        viewer.setSwitch(id, !viewer.getSwitch(id));

        if (id == 'collation' || id == 'commentary') {
            var cls = id == 'collation' ? 'tag' : 'comment';

            if (viewer.getSwitch(id)) {
                $('.' + cls).css('display', '');
            } else {
                $('.' + cls).css('display', 'none');
            }
        }
    });

});

$(document).ajaxStart(function() {
    $('.toc-dropdown .ctrl.more').unbind('click');
    $('.inner-note-link').unbind('click');
    $('.section-link').unbind('click');
    $('.xref-link').unbind('click');
});

$(document).ajaxStop(function() {
    $('.toc-dropdown .ctrl.more').bind('click', function() {
        var icon = $(this).find('span');
        var sceneExpander = $(this).parent().find('.scene-nav');
        sceneExpander.toggleClass('expanded');
        if (sceneExpander.hasClass('expanded')) {
            icon.removeClass('icon-plus-sign').addClass('icon-minus-sign');
        } else {
            icon.removeClass('icon-minus-sign').addClass('icon-plus-sign');
        }
    });
    $('.inner-note-link').bind('click', handleInnerNoteLink());
    $('.section-link').bind('click', handleSectionLink);
    $('.xref-link').bind('click', handleSectionLink);

    // lazy load images
    $('img.lazy').lazyload({
        container: $('#viewer-left-box'),
        effect: 'fadeIn',
        skip_invisible: false
    });
    $('img.lazy-cow').lazyload({
        container: $('#viewer-right-box'),
        effect: 'fadeIn',
        skip_invisible: false
    });
});

function handleInnerNoteLink() {
    // Shows marginalia notes in popups
    $('.inner-note-link').click(function() {
        console.log('click');

        // id of the element to show/hide
        var itemid = '#' + $(this).attr('target');

        // Shows the element if nothing is shown.
        if ($('.showme').length === 0) {
            $(itemid).slideDown();
            $(itemid).addClass('showme');

            // Hides the element if it is shown.
        } else if (itemid == '#' + $('.showme').attr('id')) {
            $('.showme').slideUp();
            $(itemid).removeClass('showme');

            // Switches out the current element for the next one sequentially
        } else {
            $('.showme').slideUp(function() {
                $(this).removeClass('showme');
                if ($('.inner-note:animated').length === 0) {
                    $(itemid).slideDown();
                    $(itemid).addClass('showme');
                }
            });
        }
    });
}

function handleSectionLink() {
    var panel = null;
    var rel = $(this).attr('rel').split('#');
    var section = rel[0];

    if ($(this).parents('#viewer-left-panel').length > 0) {
        panel = viewer.panels[0];
    } else {
        panel = viewer.panels[1];
    }

    panel.loadSection(section);

    if (rel.length > 1) {
        panel.scrollBoxToElement($('#' + rel[1]));
    }
}
