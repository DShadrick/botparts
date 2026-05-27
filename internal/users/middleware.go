package users

import (
	"botparts/internal/routing"
	"github.com/gempir/go-twitch-irc/v4"
)

type UserHandler func (m twitch.PrivateMessage, u *User)

type Manager interface {
    WithUser(next UserHandler) routing.Handler
}

func (u *manager) WithUser(next UserHandler) routing.Handler{
	return func(m twitch.PrivateMessage) {
		next(m, u.GetUser(m.User.Name));
	}
}