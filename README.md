# Frontend Platform Challenge

Welcome to the Frontend Platform Challenge! As part of your interview process with Raisin, the technical challenge excercise is designed to evaluate your skills in optimizing performance, integrating multiple applications, and designing a robust CI pipeline. Please read the instructions carefully and let us know if you have any questions.

## Overview

This monorepo contains three Next.js applications (`app1`, `app2`, `app3`) and one shared component library (`lib1`). Each application is simple and contains a single page with a component.

### Your Tasks

#### 1. Performance Optimization

**Task:** We have observed that `app1` takes significantly longer to build compared to the other two applications and its page is slower to load. We suspect there's a performance issue. Your task is to identify the cause of this issue and resolve it to improve its performance.

#### 2. Application Integration

**Task:** We would like to run all three Next.js applications (`app1`, `app2`, and `app3`) in parallel on the same hostname and port. It is not expected that you host these apps anywhere; they should simply run simultaneously on your local machine. Additionally, the navigation between these applications should work seamlessly. Your task is to set up the monorepo to allow all apps to run concurrently and ensure proper routing between them.

#### 3. CI Pipeline Design

**Task:** Design a Continuous Integration (CI) pipeline for this monorepo. While this monorepo is simplified to reduce complexity on the other tasks, the CI pipeline should be designed with real-world applications in mind. The pipeline should follow best practices for creating a robust and scalable system. You can represent this CI pipeline as a diagram, and feel free to use any tools or methods you prefer to design it.

## Project Setup

To get started, follow these steps:

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Build the Shared Library**:

   ```bash
   pnpm run build:libs
   ```

3. **Run the Applications**:
   Each app can be run independently using the following commands (adjust the port as needed):
   ```bash
   cd packages/app1
   pnpm run dev
   ```
   Repeat for `app2` and `app3` with their respective ports.

## Time Estimate

We expect this challenge to take up to 4 hours to complete. Please manage your time accordingly and focus on delivering the best results within this timeframe.

## Submission

Once you have completed the tasks, please do the following:

    1.	Performance Fix: Identify and resolve the performance issue in app1. Implement this fix in a feature branch. You can choose to push this fix either in the same branch as the application integration or in a separate feature branch, depending on what you think is more appropriate.
    2.	Application Integration: Implement your feature for connecting and running the three apps together in a feature branch. Please also expand the relevant README files as necessary to clearly explain how to run the apps in parallel.
    3.	CI Pipeline: Submit a diagram and explanation of your proposed CI pipeline.

**Note on Task Completion**

While solving all three tasks is a big plus, it is not mandatory in order to submit the challenge. If you find that you don’t have the capacity to address all three of them within the proposed timeframe, that’s okay — we can discuss the remaining task during the tech challenge discussion. You can solve the tasks in any order you prefer.

Please push your code and documentation to the repository and let us know once it’s ready for review.

Please do not fork or share your solution as a public repository.

If you have any questions, feel free to contact us at frontend-platform@raisin.com

Good luck, and we look forward to your submission!
