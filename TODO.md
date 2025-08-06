# TODO

## Login

## User Insights

### Deleting a media should decrease total media count

When a media item is deleted, the total media count should be decremented accordingly. This ensures that the user insights reflect the current state of the media library accurately.

## Homepage Discover

## User Bookmarks page

### Bookmark status is not showing in content cards

The bookmark status should be displayed in the content cards on the user bookmarks page.

## Content Cards

### ViewCount should have e TanStack Query state to avoid re-fetching and optimistic updates

The view count for content cards should be managed using TanStack Query to ensure that the state is consistent and to avoid unnecessary re-fetching. This will also allow for optimistic updates, where the view count can be updated immediately in the UI while the request is being processed in the background.

## Error handling

### Write tests

I suggest to delete all the tests and write new ones. The current tests are not up to date and do not cover all the functionality. We should write tests for all the components, hooks, and utilities. Both frontend and backend should have tests.

### Never use any

We should avoid using `any` type in TypeScript. Instead, we should define proper types for our data structures.

## UI/UX

### View count on mobile on discover page is not working well

It stay at 0 for new albums and do not get live hydrated.

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

## Login / Logout

### Return to the page where the user was before login

When a user logs in, they should be redirected back to the page they were on before logging in. This will improve user experience by not disrupting their workflow.

### Logout should refresh state

When a user logs out, the application state should be refreshed to ensure that any sensitive information is cleared and the user is presented with the login screen. This can be achieved by resetting the application state and redirecting the user to the homepage.
