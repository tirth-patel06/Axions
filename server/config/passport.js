// config/passport.js
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const connectDB = require("../lib/mongoose");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback",
      scope: ["repo", "read:org", "admin:repo_hook"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        await connectDB();

        let user = await User.findOne({ githubId: profile.id });


        // Extract email (GitHub may return array or undefined)
        let githubEmail = null;
        if (profile.emails && profile.emails.length > 0) {
          githubEmail = profile.emails[0].value;
        }

        if (!user) {
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            email: githubEmail,
            avatar: profile.photos?.[0]?.value,
            accessToken,
          });
        } else {
          user.username = profile.username;
          user.email = githubEmail;
          user.avatar = profile.photos?.[0]?.value;
          user.accessToken = accessToken; // update token
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
