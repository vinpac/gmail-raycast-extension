Raycast Gmail Extension
=======================

The Raycast Gmail Extension is an extension for the Raycast app that allows you to quickly access your Gmail account and see how many unread emails you have. You can also see your emails categorized by labels, and choose emojis to represent those labels.

Installation
------------

You can find and install the Raycast Gmail Extension on the [Raycast store](https://www.raycast.com/store).

Getting Started
---------------

To use the extension, you need to connect your Gmail account with SSO. Once you are logged in, you can set which labels should appear on your menu bar by going to `Set Watched Gmail Labels`. From there, you can select which labels you want to appear and set an emoji to represent each label (Cmd+K > set Emoji).


How it works
------------

The extension uses the Gmail API to access your email account and retrieve the unread email count and labels. It stores only the Watched Labels, selected by you, the emoji you selected and the number of unread emails. This information is stored locally on your device for faster access and better performance. No email content is read or saved.

Privacy
-------

The Raycast Gmail Extension only accesses the user's unread email count and email labels for it to work. It only caches the Labels Ids and Unread count for a better UX. These data can be erased at any point by Clearing the Cache on your Raycast app. Nothing is saved externally. [Read the Privacy Policy here.](https://raw.githubusercontent.com/vinpac/gmail-raycast-extension/main/PRIVACY.md)

Support
-------

If you have any issues or questions about the Raycast Gmail Extension, please contact us at <vin175pacheco@gmail.com>. We're always here to help!
