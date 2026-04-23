package main

import (
	"botparts/internal/blackjack"
	"botparts/internal/routing"
	"github.com/gempir/go-twitch-irc/v4"
)

func main() {
	router := routing.New(
		blackjack.GetRoutes(),
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