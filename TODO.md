# TODO

## User Insights

## Homepage Discover

## User Bookmarks page

## Content Cards

### On hover/tap an album card, I want to see changing thumbnails

When hovering or tapping on an album card, the thumbnail should change to another media of the album thumbnail, every 1 seconds. This will provide a more dynamic and engaging user experience.

### ViewCount Optimistic update from page to page doesn't work correctly

The optimistic update for view counts does not work correctly when navigating from page to page. We need to ensure that the view count is updated consistently across all pages.

## Error handling

### Write tests

I suggest to delete all the tests and write new ones. The current tests are not up to date and do not cover all the functionality. We should write tests for all the components, hooks, and utilities. Both frontend and backend should have tests.

### Never use any

We should avoid using `any` type in TypeScript. Instead, we should define proper types for our data structures.

## UI/UX

### The Lighbox should try to "load more" when reaching the end of the list

The Lightbox should implement an "infinite scroll" feature that automatically loads more content when the user reaches the end of the list. This will enhance the user experience by providing a seamless browsing experience without interruptions.

### Infinite scroll should be implemented on all pages

Infinite scroll should be implemented on all pages where it makes sense, such as the homepage, user pages, admin pages and album pages. Remaining: admin pages.

### Rework Welcome email

The "what you can do now" section is not coherent and should be reworked.

## User profile

### Last active date do not appears on at least my profile

It should always appears.

## Videos

### In lightbox, the video preview should be fullscreen like image

Currently, the video preview is of the size of the video.

## Admin

### Dashboard page should show stats of global app

Refactor the admin dashboard to show stats and analytics for the entire application, not just the admin's own content. This will provide a better overview of the app's performance.

### All media page

We should implement an "All Media" page in the admin section to allow admins to view and manage all media content in one place.

### All albums page

Make sure the album page return all albums, not just the ones created by the user. This will allow admins to manage all albums effectively.

### Uploading images now is 2 by 2 instead of bulk upload

Last images I uploaded were 2 by 2 instead of bulk upload. This should be fixed to allow bulk uploads for images.

## Settings

## User Profile

## User albums

### Delete album tooltip in dropdown should appear on one line

The tooltip for deleting an album in the dropdown menu should be displayed on a single line for better readability and user experience.

### Deleting an album should not wait for api response

When deleting an album, the UI should immediately reflect the deletion without waiting for the API response. This will improve user experience by making the application feel more responsive.

### Edit an album should update optimistically

When editing an album, the changes should be reflected immediately in the UI without waiting for the server response. This will improve user experience by making the application feel more responsive. Speaking of title, item count, etc.

## Optimization

### Make tanstack leverage ssg data

We should optimize our use of TanStack to leverage Static Site Generation (SSG) data effectively. This will improve performance and reduce the load on our servers.

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
