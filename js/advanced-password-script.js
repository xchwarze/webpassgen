(function($) {
    'use strict';

    $('#mouse-entropy-modal').on('shown.bs.modal', function () {
        // from randogram.js
        startCanvas();
    })


    $('#mouse-entropy-modal').on('hidden.bs.modal', function () {
        // from randogram.js
        stopCanvas();

        // from main.js
        toggleEntropyVisibility();
    })

    // yo no hago nada de esto por defecto
    //setSecurity();
    //loadPasses();
})(jQuery);
