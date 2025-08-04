# TODO

## Error handling

### Write tests

I suggest to delete all the tests and write new ones. The current tests are not up to date and do not cover all the functionality. We should write tests for all the components, hooks, and utilities. Both frontend and backend should have tests.

### Never use any

We should avoid using `any` type in TypeScript. Instead, we should define proper types for our data structures.

## UI/UX

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

## Settings

## User albums

## Optimization

### http://localhost:3001/user/interactions/status should support bulk requests

Currently, we send one request per media, it's not efficient. We should support bulk requests to reduce the number of API calls.

## Comments

### Revalidation seems to not be working when adding a comment

When a comment is added, the comments list should be revalidated. This is not working as expected. Reloading the page does not show the new comment.
