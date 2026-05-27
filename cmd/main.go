package main

import (
	"botparts/internal/users"
	"botparts/internal/blackjack"
	"botparts/internal/routing"
	"github.com/gempir/go-twitch-irc/v4"
)

func main() {
	userManager := users.NewManager()
	router := routing.New(
		blackjack.GetRoutes(userManager),
	)
	//TODO: re-read twich oath docs and generate creds to pass in at start or read from file
	//client := twitch.NewClient("botparts", "oauth:1234")
	client := twitch.NewAnonymousClient()// anonymous user (no write capabilities)
	client.OnPrivateMessage(router.Dispatch)
	client.Join("danparts")

	err := client.Connect()
	if err != nil {
		panic(err)
	}
}