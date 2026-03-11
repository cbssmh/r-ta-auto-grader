# R Assignment Auto Grader

An automated grading tool for R programming assignments.

This project executes student-submitted R scripts, captures their console output using `R CMD BATCH`, and compares the results with a reference solution. It was designed to automate repetitive grading tasks and reduce manual effort for teaching assistants.

## Motivation

While working as a teaching assistant, grading R assignments manually required executing each script and checking outputs line by line. This process was time-consuming and prone to human error.

This tool automates the grading process by:

- running student R scripts automatically
- capturing interactive console outputs
- comparing outputs with the reference solution
- generating a summarized grading report

## Features

- Batch execution of multiple R scripts
- Output comparison with reference solution
- Timeout protection for infinite loops
- Automatic CSV grading report
- Simple directory-based submission management

## Tech Stack

- Node.js
- R
- Node.js `child_process` for process execution
- Node.js `fs` for file system automation

## Project Structure

```
r-autograder/
│
├── grader.js
├── answer.R
├── package.json
├── README.md
├── .gitignore
│
├── students/
│   ├── example_student1.R
│   └── example_student2.R
│
└── results/
    └── results.csv
```

| File | Description |
|-----|-------------|
| grader.js | Main grading script |
| answer.R | Reference solution |
| students/ | Student submissions |
| results/ | Grading output |

## Requirements

Make sure the following software is installed:

### Node.js

```bash
node --version
```

### R

```bash
R --version
```

## How It Works

1. The reference solution (`answer.R`) is executed.
2. Each student script in the `students/` directory is executed using `R CMD BATCH`.
3. The generated `.Rout` output files are processed.
4. Outputs are normalized and compared.
5. Results are written to a CSV file.

## Usage

Run the grader from the project root:

```bash
node grader.js
```

Example console output:

```
student1.R -> PASS
student2.R -> FAIL
student3.R -> ERROR
```

The grading results will be saved in:

```
results/results.csv
```

Example:

```
filename,result,reason
student1.R,PASS,Matched
student2.R,FAIL,Output Mismatch
student3.R,ERROR,Time Limit Exceeded
```

## Example Student Script

```r
scores <- c(80, 60, 70, 50, 90)
mean_score <- mean(scores)

scores
mean_score
```

This project supports assignments where output appears through interactive evaluation (without explicit `print()` calls).

## Challenges

Some challenges addressed in this project include:

- Handling interactive output from R scripts
- Removing non-deterministic metadata from `.Rout` files
- Normalizing outputs to avoid false negatives
- Managing execution time limits for student scripts

## Future Improvements

Possible improvements include:

- Docker sandbox execution for secure grading
- Partial scoring for multi-problem assignments
- Detailed output diff visualization
- Web interface for submission management

## License

MIT License
