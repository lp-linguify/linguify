# Automatic Vocabulary Association for Matching Exercises

## Overview

The `matching_auto_associate` tool automatically associates relevant vocabulary items with matching exercises in the Linguify application. This command eliminates the need to manually associate each vocabulary word with each matching exercise, which would be tedious and time-consuming.

## Installation

The tool is installed as a Django command in the folder:
```
backend/apps/course/management/commands/matching_auto_associate.py
```

The `__init__.py` files must exist in the `management/` and `management/commands/` folders for Django to recognize the command.

## Usage

### Basic Command

To run the command with default parameters (process all matching exercises without erasing existing associations):

```bash
python manage.py matching_auto_associate
```

### Available Options

| Option | Description |
|--------|-------------|
| `--lesson=ID` | Process only the exercise with the specified content lesson ID |
| `--force` | Replace existing associations instead of preserving them |

### Usage Examples

1. **Associate all vocabulary words with all matching exercises**
   ```bash
   python manage.py matching_auto_associate --force
   ```

2. **Associate vocabulary words with exercises in a specific lesson**
   ```bash
   python manage.py matching_auto_associate --lesson=23 --force
   ```

3. **Check which exercises would be updated without making changes**
   ```bash
   python manage.py matching_auto_associate
   ```

## How It Works

For each matching exercise, the tool:

1. Checks if a `MatchingExercise` object exists for that lesson, and skips or clears existing associations based on the `--force` flag
2. First looks for vocabulary words in the same content lesson
3. If no words are found, searches in all vocabulary lessons belonging to the same parent lesson
4. Associates found words with the matching exercise, limited by the exercise's `pairs_count` setting

The vocabulary words are used to create matching pairs between target language and native language terms, which creates an engaging language learning activity.

## Admin Interface

In addition to the CLI command, you can use the admin action in the Django interface:

1. Access the admin interface at `/admin/course/matchingexercise/`
2. Select the exercises to update
3. In the "Actions" dropdown menu, choose "Associate vocabulary items from lessons"
4. Click "Go"

This performs the same operation as the command-line tool but through the admin UI.

## Best Practices

- **Create your vocabulary lessons first**: The tool can only associate existing words
- **Use the `--force` option with caution**: It erases existing associations
- **Run the command after adding new vocabulary**: To keep associations up to date
- **Set appropriate `pairs_count`**: This determines how many vocabulary items are used in each exercise

## Command Output

The command provides detailed output showing:

- Number of matching exercises found
- Which exercises are being updated/skipped
- How many vocabulary items are being added to each exercise
- A summary of the total updates made

## Troubleshooting

| Problem | Solution |
|----------|----------|
| "No vocabulary items found" | Verify that vocabulary words exist in the same unit and lesson |
| No words added | Use the `--force` option to replace existing associations |
| "Unknown command" error | Check that `__init__.py` files exist in the `management` folders |
| Too few vocabulary items | Increase the `pairs_count` parameter in the exercise |

## Relationship with VocabularyList

The `MatchingExercise` model has a many-to-many relationship with `VocabularyList` through the `vocabulary_words` field. This allows matching exercises to use vocabulary from different sources:

1. The same content lesson
2. Any vocabulary-type content lesson in the same parent lesson

This flexibility ensures that matching exercises can always be populated with relevant vocabulary.

## Maintenance

To modify the tool's behavior:

1. Edit the file `backend/apps/course/management/commands/matching_auto_associate.py`
2. You can adjust the vocabulary word search logic in the `handle()` method
3. To modify the admin action, edit the `associate_vocabulary_from_lesson()` method in `admin.py`

---

## Recommended Workflow for Content Creation

1. First create all your lessons and their vocabulary content
2. Create matching exercises in the content lessons that should have them
3. Run `python manage.py matching_auto_associate --force` to automatically associate all vocabulary
4. When adding new vocabulary words, run the command again
5. Use the admin interface for quick updates to individual exercises