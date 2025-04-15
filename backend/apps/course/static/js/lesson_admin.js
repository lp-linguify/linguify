(function($) {
    console.log("Script loading...");
    
    $(document).ready(function() {
        console.log("DOM ready");
        
        // Sélecteur du champ de type de leçon
        var lessonTypeField = $('#id_lesson_type');
        console.log("Lesson type field found:", lessonTypeField.length > 0);
        console.log("Current value:", lessonTypeField.val());
        
        // Trouver plus précisément le fieldset professionnel
        var professionalFieldset = $('fieldset:contains("Professional Information")');
        console.log("Professional fieldset found:", professionalFieldset.length > 0);
        
        // Fonction pour mettre à jour la visibilité
        function updateProfessionalFieldVisibility() {
            var isVisible = lessonTypeField.val() === 'professional';
            console.log("Should be visible:", isVisible);
            
            if (isVisible) {
                professionalFieldset.show();
                $('#id_professional_field').prop('required', true);
            } else {
                professionalFieldset.hide();
                $('#id_professional_field').val('').prop('required', false);
            }
        }
        
        // Exécuter la fonction au chargement avec un petit délai
        setTimeout(function() {
            console.log("Running initial visibility update");
            updateProfessionalFieldVisibility();
        }, 200);
        
        // Ajouter un écouteur d'événement pour le changement de type
        lessonTypeField.on('change', function() {
            console.log("Lesson type changed to:", $(this).val());
            updateProfessionalFieldVisibility();
        });
    });
})(django.jQuery);