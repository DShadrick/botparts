package routing

import (
	"regexp"
	"github.com/gempir/go-twitch-irc/v4"
)

type Route struct {
	Pattern *regexp.Regexp
	Handler Handler
}

type Handler func (message twitch.PrivateMessage)

type Router struct {
	routes []Route
}

func New(allRoutes ...[]Route) *Router {
	combined := []Route{}
	for _, batch := range allRoutes {
		combined = append(combined, batch...)
	}
	return &Router{routes: combined}
}

func (r *Router) Dispatch (message twitch.PrivateMessage) {
	for _, route := range r.routes {
		if route.Pattern.MatchString(message.Message) {
			route.Handler(message)
			return
		}
	}
}