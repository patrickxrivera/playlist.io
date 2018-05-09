const request = require('request');

const User = require('../models/User');
const pluck = require('ramda/src/pluck');

const getPlaylistId = (user) => user.playlists[user.playlists.length - 1]._id;

const saveToDb = async (req, res) => {
  const { spotifyId } = req.body;

  const targetUser = await User.findOne({ spotifyId });

  targetUser.playlists.push(req.body);
  await targetUser.save();

  const playlistId = getPlaylistId(targetUser);

  res.send({ success: true, playlistId });
};

const saveToSpotify = (req) => {
  const { spotifyId, title, accessToken, tracks } = req.body;

  const createPlaylistOptns = {
    url: `https://api.spotify.com/v1/users/${spotifyId}/playlists`,
    body: {
      name: title
    },
    headers: { Authorization: 'Bearer ' + accessToken },
    json: true
  };

  request.post(createPlaylistOptns, async (error, response, body) => {
    const playlistId = body.id;

    const uris = pluck('uri')(tracks);

    const addTracksOptns = {
      url: `https://api.spotify.com/v1/users/${spotifyId}/playlists/${playlistId}/tracks`,
      headers: { Authorization: 'Bearer ' + accessToken },
      body: { uris },
      json: true
    };

    request.post(addTracksOptns);
  });
};

const save = (req, res) => {
  saveToDb(req, res);
  saveToSpotify(req);
};

const fetch = async (req, res, next) => {
  const targetUser = await User.findOne({ spotifyId: req.body.spotifyId });

  if (!targetUser) {
    const errMsg = 'Invalid Spotify ID';
    next(errMsg);
    return;
  }

  const { playlists } = targetUser;

  res.send({ success: true, playlists });
};

module.exports = {
  save,
  fetch
};
