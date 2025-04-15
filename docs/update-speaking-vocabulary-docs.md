# Documentation: Automatic Vocabulary Association for Speaking Exercises

## Overview

The `speaking_auto_associate` tool automatically associates relevant vocabulary items with speaking exercises in the Linguify application. This command eliminates the need to manually associate each vocabulary word with each speaking exercise, which would be tedious and time-consuming.

## Installation

The tool is installed as a Django command in the folder:
```
backend/apps/course/management/commands/speaking_auto_associate.py
```

The `__init__.py` files must exist in the `management/` and `management/commands/` folders for Django to recognize the command.

## Usage

### Basic Command

To run the command with default parameters (process all speaking exercises without erasing existing associations):

```bash
python manage.py speaking_auto_associate
```

### Available Options

| Option | Description |
|--------|-------------|
| `--lesson=ID` | Process only the exercise with the specified lesson ID |
| `--force` | Replace existing associations instead of preserving them |

### Usage Examples

1. **Associate all vocabulary words with all speaking exercises**
   ```bash
   python manage.py speaking_auto_associate --force
   ```

2. **Associate vocabulary words with a specific exercise**
   ```bash
   python manage.py speaking_auto_associate --lesson=24
   ```

3. **Update a specific exercise by replacing existing associations**
   ```bash
   python manage.py speaking_auto_associate --lesson=24 --force
   ```

## How It Works

For each speaking exercise, the tool:

1. Checks if a `SpeakingExercise` object exists for that lesson, and creates one if necessary
2. First looks for vocabulary words in the same content lesson
3. If no words are found, searches in all vocabulary lessons belonging to the same parent lesson
4. Associates all found words with the speaking exercise

## Admin Interface

In addition to the CLI command, you can use the admin action in the Django interface:

1. Access the admin interface at `/admin/course/speakingexercise/`
2. Select the exercises to update
3. In the "Actions" dropdown menu, choose "Associate vocabulary items from lessons"
4. Click "Go"

## Best Practices

- **Create your vocabulary lessons first**: The tool can only associate existing words
- **Use the `--force` option with caution**: It erases existing associations
- **Run the command after adding new words**: To keep associations up to date

## Troubleshooting

| Problem | Solution |
|----------|----------|
| "No vocabulary items found" | Verify that vocabulary words exist in the same unit and lesson |
| No words added | Use the `--force` option to replace existing associations |
| "Unknown command" error | Check that `__init__.py` files exist in the `management` folders |

## Maintenance

To modify the tool's behavior:

1. Edit the file `backend/apps/course/management/commands/speaking_auto_associate.py`
2. You can adjust the vocabulary word search logic in the `handle()` method
3. To modify the admin action, edit the `associate_vocabulary_from_lesson()` method in `admin.py`

---

Recommended usage for the Linguify project:
1. First create all your lessons and their vocabulary content
2. Run `python manage.py speaking_auto_associate --force` to automatically associate all vocabulary
3. When adding new vocabulary words, run the command again