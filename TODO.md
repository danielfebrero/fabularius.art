# TODO

## Error handling

## UI/UX

### On tablet, ContentCard should display actions after one tap instead of navigating

Currently, on tablet devices, the ContentCard navigates to the content page when tapped. Instead, it should display actions (like share, save, etc.) after one tap, similar to how it works on mobile devices.

### On tablet, show textual menu instead of icons in app header

Currently, the app header on tablet devices shows only icons. There is space for text.

### Make admin page responsive

Currently, it's unusable on mobile devices. We need to ensure that the admin page is fully responsive and functional on smaller screens.

### Rework Welcome email

The "what you can do now" section is not coherent and should be reworked.

### Auto connect the user when he verifies his email

When the user clicks the verification link, he should be automatically logged in.

### Improve skeleton

Currently, the backward and share buttons are on the edge sides instead of being in the container.

### Content card should automatically detect the best media to display depending on the container size

The content card should automatically choose the best media to display based on the container size, rather than using an algo based on columns/viewport. Preferred size must have predominance over the algorithm.

## User profile

### On tablet, when uploading an avatar, there is a UI bug under the avatar

When uploading an avatar on tablet devices, there is a UI bug where the upload button appears under the avatar image, making it ugly.

### If loggeed out, accessing a user profile display Profile Not Found while it should display "You must be logged in to view this profile"

This is not correct. It should display "You must be logged in to view this profile" instead of "Profile Not Found".

### Creator Insights

Currently we show mocked data for creator insights. We should implement the real data.

## Videos

### In lightbox, the video preview should be fullscreen like image

Currently, the video preview is of the size of the video.

## Admin

## Settings

### BUG on change language to default navigator

Currently, when changing the language to the default navigator language, it does not work as expected. It stays on the previous language.
