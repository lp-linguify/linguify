// static/admin/js/json_prettify.js
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
      // Améliorer tous les champs JSON
      enhanceJSONFields();
      
      // Créer des boutons de prévisualisation pour les champs de texte avec trous
      addSentencePreviewButtons();
      
      // Ajouter la validation croisée des langues entre les champs
      addCrossFieldValidation();
    });
    
    /**
     * Améliore tous les champs JSON dans le formulaire
     */
    function enhanceJSONFields() {
      const jsonFields = document.querySelectorAll('.json-editor');
      
      jsonFields.forEach(field => {
        // Ajouter une barre d'outils au-dessus du champ
        addToolbar(field);
        
        // Mettre en forme le JSON au chargement initial
        formatJSONField(field);
        
        // Ajouter un événement au changement du champ
        field.addEventListener('change', function() {
          formatJSONField(this);
        });
        
        // Ajouter la coloration syntaxique (si disponible)
        if (window.CodeMirror) {
          const cm = CodeMirror.fromTextArea(field, {
            mode: "application/json",
            theme: "default",
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
              "Ctrl-Space": "autocomplete",
              "Tab": function(cm) {
                const spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                cm.replaceSelection(spaces);
              }
            }
          });
          
          cm.on("change", function() {
            cm.save();
            validateJSONField(field);
          });
        }
      });
    }
    
    /**
     * Ajoute une barre d'outils au champ
     */
    function addToolbar(field) {
      const toolbar = document.createElement('div');
      toolbar.className = 'json-toolbar';
      
      const formatBtn = document.createElement('button');
      formatBtn.textContent = 'Format JSON';
      formatBtn.className = 'button';
      formatBtn.type = 'button';
      formatBtn.addEventListener('click', function(e) {
        e.preventDefault();
        formatJSONField(field);
      });
      
      const validateBtn = document.createElement('button');
      validateBtn.textContent = 'Valider JSON';
      validateBtn.className = 'button';
      validateBtn.type = 'button';
      validateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        validateJSONField(field);
      });
      
      const statusSpan = document.createElement('span');
      statusSpan.className = 'json-status';
      statusSpan.id = 'status-' + field.id;
      
      toolbar.appendChild(formatBtn);
      toolbar.appendChild(validateBtn);
      toolbar.appendChild(statusSpan);
      
      field.parentNode.insertBefore(toolbar, field);
    }
    
    /**
     * Formate un champ JSON
     */
    function formatJSONField(field) {
      try {
        const value = field.value.trim();
        if (!value) return;
        
        const json = JSON.parse(value);
        field.value = JSON.stringify(json, null, 2);
        
        // Mettre à jour le statut
        const statusEl = document.getElementById('status-' + field.id);
        if (statusEl) {
          statusEl.textContent = '✓ Valide';
          statusEl.className = 'json-status valid';
        }
      } catch (e) {
        console.error('Error formatting JSON:', e);
        
        // Mettre à jour le statut
        const statusEl = document.getElementById('status-' + field.id);
        if (statusEl) {
          statusEl.textContent = '✗ Invalide: ' + e.message;
          statusEl.className = 'json-status invalid';
        }
      }
    }
    
    /**
     * Valide un champ JSON
     */
    function validateJSONField(field) {
      const statusEl = document.getElementById('status-' + field.id);
      if (!statusEl) return;
      
      try {
        const value = field.value.trim();
        if (!value) {
          statusEl.textContent = '';
          return;
        }
        
        // Valider le JSON
        JSON.parse(value);
        
        statusEl.textContent = '✓ Valide';
        statusEl.className = 'json-status valid';
      } catch (e) {
        statusEl.textContent = '✗ Invalide: ' + e.message;
        statusEl.className = 'json-status invalid';
      }
    }
    
    /**
     * Ajoute des boutons de prévisualisation pour les champs de texte avec trous
     */
    function addSentencePreviewButtons() {
      // Trouver le champ 'sentences'
      const sentencesField = document.querySelector('#id_sentences');
      if (!sentencesField) return;
      
      // Créer la zone de prévisualisation
      const previewContainer = document.createElement('div');
      previewContainer.className = 'sentence-preview-container';
      previewContainer.innerHTML = '<h3>Prévisualisation des phrases</h3><div class="preview-content"></div>';
      
      // Ajouter la prévisualisation après le champ
      sentencesField.parentNode.appendChild(previewContainer);
      
      // Ajouter un bouton de prévisualisation
      const previewBtn = document.createElement('button');
      previewBtn.textContent = 'Prévisualiser les phrases';
      previewBtn.className = 'button preview-btn';
      previewBtn.type = 'button';
      
      previewBtn.addEventListener('click', function(e) {
        e.preventDefault();
        updateSentencePreview(sentencesField, previewContainer.querySelector('.preview-content'));
      });
      
      // Ajouter le bouton à la barre d'outils
      const toolbar = sentencesField.previousElementSibling;
      if (toolbar && toolbar.classList.contains('json-toolbar')) {
        toolbar.appendChild(previewBtn);
      }
    }
    
    /**
     * Met à jour la prévisualisation des phrases
     */
    function updateSentencePreview(field, container) {
      try {
        const value = field.value.trim();
        if (!value) {
          container.innerHTML = '<p>Aucune phrase à prévisualiser.</p>';
          return;
        }
        
        const sentences = JSON.parse(value);
        let html = '';
        
        // Prévisualiser chaque phrase par langue
        for (const lang in sentences) {
          const sentence = sentences[lang];
          
          // Remplacer ___ par un champ visible
          const formattedSentence = sentence.replace(/___/g, '<span class="blank-placeholder">___</span>');
          
          html += `
            <div class="sentence-preview">
              <div class="language-label">${lang.toUpperCase()}</div>
              <div class="sentence">${formattedSentence}</div>
            </div>
          `;
        }
        
        container.innerHTML = html || '<p>Aucune phrase à prévisualiser.</p>';
      } catch (e) {
        container.innerHTML = `<p class="error">Erreur de prévisualisation: ${e.message}</p>`;
      }
    }
    
    /**
     * Ajoute la validation croisée entre les champs sentences et correct_answers
     */
    function addCrossFieldValidation() {
      const sentencesField = document.querySelector('#id_sentences');
      const answersField = document.querySelector('#id_correct_answers');
      const optionsField = document.querySelector('#id_answer_options');
      
      if (!sentencesField || !answersField || !optionsField) return;
      
      // Créer la zone de validation
      const validationContainer = document.createElement('div');
      validationContainer.className = 'cross-validation-container';
      validationContainer.innerHTML = '<h3>Validation des langues</h3><div class="validation-content"></div>';
      
      // Ajouter la validation après les champs
      const fieldset = sentencesField.closest('fieldset');
      if (fieldset) {
        fieldset.appendChild(validationContainer);
      }
      
      // Ajouter un bouton de validation
      const validateBtn = document.createElement('button');
      validateBtn.textContent = 'Valider les langues';
      validateBtn.className = 'button validate-langs-btn';
      validateBtn.type = 'button';
      
      validateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        validateLanguageConsistency(
          sentencesField, 
          answersField, 
          optionsField,
          validationContainer.querySelector('.validation-content')
        );
      });
      
      // Ajouter le bouton après les champs
      if (fieldset) {
        fieldset.querySelector('.form-row').appendChild(validateBtn);
      }
    }
    
    /**
     * Valide la cohérence des langues entre les différents champs
     */
    function validateLanguageConsistency(sentencesField, answersField, optionsField, container) {
      try {
        const sentences = JSON.parse(sentencesField.value || '{}');
        const answers = JSON.parse(answersField.value || '{}');
        const options = JSON.parse(optionsField.value || '{}');
        
        const sentenceLangs = Object.keys(sentences);
        const answerLangs = Object.keys(answers);
        const optionLangs = Object.keys(options);
        
        // Construire l'ensemble de toutes les langues
        const allLangs = new Set([...sentenceLangs, ...answerLangs, ...optionLangs]);
        
        let html = '<table class="lang-validation-table"><thead><tr>' +
                   '<th>Langue</th><th>Phrase</th><th>Options</th><th>Réponse</th><th>Statut</th>' +
                   '</tr></thead><tbody>';
        
        // Vérifier chaque langue
        for (const lang of allLangs) {
          const hasSentence = sentenceLangs.includes(lang);
          const hasAnswer = answerLangs.includes(lang);
          const hasOptions = optionLangs.includes(lang);
          
          const isComplete = hasSentence && hasAnswer && hasOptions;
          const status = isComplete ? 'Complet' : 'Incomplet';
          const statusClass = isComplete ? 'complete' : 'incomplete';
          
          html += `
            <tr class="${statusClass}">
              <td>${lang}</td>
              <td>${hasSentence ? '✓' : '✗'}</td>
              <td>${hasOptions ? '✓' : '✗'}</td>
              <td>${hasAnswer ? '✓' : '✗'}</td>
              <td class="status ${statusClass}">${status}</td>
            </tr>
          `;
        }
        
        html += '</tbody></table>';
        
        // Ajouter un résumé
        const totalLangs = allLangs.size;
        const completeLangs = [...allLangs].filter(lang => 
          sentenceLangs.includes(lang) && 
          answerLangs.includes(lang) && 
          optionLangs.includes(lang)
        ).length;
        
        html += `
          <div class="validation-summary">
            <p>${completeLangs} langues complètes sur ${totalLangs} langues détectées.</p>
            <p>${totalLangs - completeLangs} langues incomplètes qui nécessitent votre attention.</p>
          </div>
        `;
        
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = `<p class="error">Erreur de validation: ${e.message}</p>`;
      }
    }
  })();