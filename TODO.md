# TODO

## Login

## Homepage Discover

## Content Cards

### Liking a content should update optimistically the view count

When a user likes a content, the UI should update immediately to reflect the new like count without waiting for the server response. This will improve user experience by making the application feel more responsive.

## Error handling

### Write tests

I suggest to delete all the tests and write new ones. The current tests are not up to date and do not cover all the functionality. We should write tests for all the components, hooks, and utilities. Both frontend and backend should have tests.

### Never use any

We should avoid using `any` type in TypeScript. Instead, we should define proper types for our data structures.

## UI/UX

### MediaCard view count should be fetched async

Currently, it SSG on some pages which is not ideal. We should fetch the view count asynchronously to ensure that the data is always up to date without blocking the initial page load.

### Make admin page responsive

Currently, it's unusable on mobile devices. We need to ensure that the admin page is fully responsive and functional on smaller screens.

### Rework Welcome email

The "what you can do now" section is not coherent and should be reworked.

### Auto connect the user when he verifies his email

When the user clicks the verification link, he should be automatically logged in.

### Improve skeleton

Currently, the backward and share buttons are on the edge sides instead of being in the container.

## User profile

## Videos

### In lightbox, the video preview should be fullscreen like image

Currently, the video preview is of the size of the video.

## Admin

### Uploading images now is 2 by 2 instead of bulk upload

Last images I uploaded were 2 by 2 instead of bulk upload. This should be fixed to allow bulk uploads for images.

## Settings

## User albums

## User medias

On the user media page, we should be able to delete media.

## Optimization

### Share types between frontend and backend

We should ensure that the types used in the frontend and backend for shared data structures are consistent. This will help avoid type mismatches and improve code maintainability.

## Comments

## Infrastructure

### Migrate to Terraform

We should migrate our infrastructure to Terraform for better management and scalability.

### Migrate to Next.js 15

We should upgrade our Next.js version to 15 to take advantage of the latest features and improvements.

### Migrate to React.js 19

We should upgrade our React.js version to 19 to take advantage of the latest features and improvements.
