module 0x0::tamagosui;

use std::string::{Self, String};
use sui::{clock::Clock, display, dynamic_field, event, package};
use sui::coin::{Self as coin, Coin};
use sui::sui::SUI;

// === Errors ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
const E_PET_TOO_TIRED: u64 = 103;
const E_PET_TOO_HUNGRY: u64 = 104;
const E_ITEM_ALREADY_EQUIPPED: u64 = 105;
const E_NO_ITEM_EQUIPPED: u64 = 106;
const E_NOT_ENOUGH_EXP: u64 = 107;
const E_PET_IS_ASLEEP: u64 = 108;
const E_PET_IS_ALREADY_ASLEEP: u64 = 109;
const E_FRIEND_ALREADY_EXISTS: u64 = 201;
const E_FRIEND_NOT_FOUND: u64 = 202;
const E_CANNOT_ADD_SELF: u64 = 203;
const E_LISTING_NOT_FOUND: u64 = 301;
const E_INSUFFICIENT_PAYMENT: u64 = 302;
const E_NO_STOCK: u64 = 303;

// === Constants ===
const PET_LEVEL_1_IMAGE_URL: vector<u8> = b"https://www.google.com/url?sa=i&url=https%3A%2F%2Ftenor.com%2Fsearch%2F8bit-cat-gifs&psig=AOvVaw3opk0W3LPjDLgGGeiDirvi&ust=1757227361516000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCID875bEw48DFQAAAAAdAAAAABAp";
const PET_LEVEL_1_IMAGE_WITH_GLASSES_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreibizappmcjaq5a5metl27yc46co4kxewigq6zu22vovwvn5qfsbiu";
const PET_LEVEL_2_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreia5tgsowzfu6mzjfcxagfpbkghfuho6y5ybetxh3wabwrc5ajmlpq";
const PET_LEVEL_2_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreif5bkpnqyybq3aqgafqm72x4wfjwcuxk33vvykx44weqzuilop424";
const PET_LEVEL_3_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreidnqerfwxuxkrdsztgflmg5jwuespdkrazl6qmk7ykfgmrfzvinoy";
const PET_LEVEL_3_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigs6r3rdupoji7pqmpwe76z7wysguzdlq43t3wqmzi2654ux5n6uu";
const PET_SLEEP_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreihwofl5stihtzjixfhrtznd7zqkclfhmlshgsg7cbszzjqqpvf7ae";
const ACCESSORY_GLASSES_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigyivmq45od3jkryryi3w6t5j65hcnfh5kgwpi2ex7llf2i6se7de";

const EQUIPPED_ITEM_KEY: vector<u8> = b"equipped_item";
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";

// === Game Balance ===
public struct GameBalance has copy, drop {
    max_stat: u8,
    
    // Feed settings
    feed_coins_cost: u64,
    feed_experience_gain: u64,
    feed_hunger_gain: u8,
    
    // Play settings
    play_energy_loss: u8,
    play_hunger_loss: u8,
    play_experience_gain: u64,
    play_happiness_gain: u8,
    
    // Work settings
    work_energy_loss: u8,
    work_happiness_loss: u8,
    work_hunger_loss: u8,
    work_coins_gain: u64,
    work_experience_gain: u64,
    
    // Sleep settings (in milliseconds)
    sleep_energy_gain_ms: u64,
    sleep_happiness_loss_ms: u64,
    sleep_hunger_loss_ms: u64,

    // Level settings
    exp_per_level: u64,
}

fun get_game_balance(): GameBalance {
    GameBalance {
        max_stat: 100,
        
        // Feed
        feed_coins_cost: 5,
        feed_experience_gain: 5,
        feed_hunger_gain: 20,
        
        // Play
        play_energy_loss: 15,
        play_hunger_loss: 15,
        play_experience_gain: 10,
        play_happiness_gain: 25,
        
        // Work
        work_energy_loss: 20,
        work_hunger_loss: 20,
        work_happiness_loss: 20,
        work_coins_gain: 10,
        work_experience_gain: 15,

        // Sleep (rates per millisecond)
        sleep_energy_gain_ms: 1000,    // 1 energy per second
        sleep_happiness_loss_ms: 700, // 1 happiness loss per 0.7 seconds
        sleep_hunger_loss_ms: 500,    // 1 hunger loss per 0.5 seconds
        
        // Level
        exp_per_level: 100,
    }
}

public struct TAMAGOSUI has drop {}

public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

// === Marketplace ===
public struct Marketplace has key, store { id: UID }

// Listing that holds custody of a Pet while listed on the marketplace
public struct PetListing has key, store {
    id: UID,
    pet: Pet,
    seller: address,
    price: u64, // in MIST (1 SUI = 1_000_000_000)
}

// Shop listing for mint-on-purchase items
public struct ShopListing has key, store {
    id: UID,
    name: String,
    image_url: String,
    price: u64, // in MIST
    stock: u64,
    owner: address,
    // Predefined stats/game data
    coins: u64,
    energy: u8,
    happiness: u8,
    hunger: u8,
    experience: u64,
    level: u8,
}

// === Social / Friends ===
public struct FriendList has key, store {
    id: UID,
    friends: vector<FriendEntry>,
}

public struct FriendEntry has store, drop {
    alias: String,
    addr: address,
}

public struct PetAccessory has key, store {
    id: UID,
    name: String,
    image_url: String
}

public struct PetStats has store {
    energy: u8,
    happiness: u8,
    hunger: u8,
}

public struct PetGameData has store {
    coins: u64,
    experience: u64,
    level: u8,
}

// === Events ===

public struct PetAdopted has copy, drop {
    pet_id: ID,
    name: String,
    adopted_at: u64
}
public struct PetAction has copy, drop {
    pet_id: ID,
    action: String,
    energy: u8,
    happiness: u8,
    hunger: u8
}

fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let publisher = package::claim(witness, ctx);

    let pet_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url"),
        string::utf8(b"birth_date"),
        string::utf8(b"experience"),
        string::utf8(b"level"),
    ];

    let pet_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{adopted_at}"),
        string::utf8(b"{game_data.experience}"),
        string::utf8(b"{game_data.level}"),
    ];

    let mut pet_display = display::new_with_fields<Pet>(&publisher, pet_keys, pet_values, ctx);
    pet_display.update_version();
    transfer::public_transfer(pet_display, ctx.sender());

    let accessory_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url")
    ];
    let accessory_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}")
    ];
    let mut accessory_display = display::new_with_fields<PetAccessory>(&publisher, accessory_keys, accessory_values, ctx);
    accessory_display.update_version();
    transfer::public_transfer(accessory_display, ctx.sender());

    transfer::public_transfer(publisher, ctx.sender());

    // Initialize a shared Marketplace object
    let mut market = Marketplace { id: object::new(ctx) };
    // Create initial super pet shop listing under the marketplace using a string key
    let super_shop = ShopListing {
        id: object::new(ctx),
        name: string::utf8(b"Super Pet"),
        image_url: string::utf8(b"https://static.vecteezy.com/system/resources/previews/009/482/567/non_2x/8-bit-pixel-character-game-illustration-vector.jpg"),
        price: 200_000_000, // 0.2 SUI in MIST
        stock: 5,
        owner: @0x42f4014d2bedb4df13d5458853824d959e5d19e8552abcbbfa4c9550850c92cd,
        coins: 1000,
        energy: 100,
        happiness: 100,
        hunger: 100,
        experience: 9999,
        level: 3,
    };
    let shop_key = string::utf8(b"shop_super");
    dynamic_field::add(&mut market.id, shop_key, super_shop);
    // Share marketplace so anyone can list/buy
    transfer::share_object(market);
}

// === Friend List API ===
public entry fun create_friend_list(ctx: &mut TxContext) {
    let list = FriendList { id: object::new(ctx), friends: vector::empty<FriendEntry>() };
    transfer::public_transfer(list, ctx.sender());
}

public entry fun add_friend(list: &mut FriendList, alias: String, friend_addr: address, ctx: &TxContext) {
    // Disallow adding self
    assert!(friend_addr != ctx.sender(), E_CANNOT_ADD_SELF);

    // Disallow duplicates
    let mut i = 0;
    let len = vector::length(&list.friends);
    while (i < len) {
        let entry_ref = vector::borrow(&list.friends, i);
        let a_addr = copy entry_ref.addr;
        assert!(a_addr != friend_addr, E_FRIEND_ALREADY_EXISTS);
        i = i + 1;
    };

    vector::push_back(&mut list.friends, FriendEntry { alias, addr: friend_addr });
}

public entry fun remove_friend(list: &mut FriendList, friend_addr: address) {
    let mut i = 0;
    let len = vector::length(&list.friends);
    let mut found = false;
    let mut idx: u64 = 0;
    while (i < len) {
    let entry_ref = vector::borrow(&list.friends, i);
    let a_addr = copy entry_ref.addr;
        if (a_addr == friend_addr) { found = true; idx = i; i = len; } else { i = i + 1; };
    };
    assert!(found, E_FRIEND_NOT_FOUND);
    let _ = vector::remove(&mut list.friends, idx);
}

// Views
public fun get_friends(list: &FriendList): vector<address> {
    let mut out = vector::empty<address>();
    let mut i = 0;
    let len = vector::length(&list.friends);
    while (i < len) {
    let entry_ref = vector::borrow(&list.friends, i);
    let a_addr = copy entry_ref.addr;
        vector::push_back(&mut out, a_addr);
        i = i + 1;
    };
    out
}

public fun has_friend(list: &FriendList, friend_addr: address): bool {
    let mut i = 0;
    let len = vector::length(&list.friends);
    let mut res = false;
    while (i < len) {
        let entry_ref = vector::borrow(&list.friends, i);
        let a_addr = copy entry_ref.addr;
        if (a_addr == friend_addr) { res = true; };
        i = i + 1;
    };
    res
}

public fun friends_len(list: &FriendList): u64 { vector::length(&list.friends) }

public fun friend_at(list: &FriendList, i: u64): address {
    let entry_ref = vector::borrow(&list.friends, i);
    copy entry_ref.addr
}

public entry fun adopt_pet(
    name: String,
    image_url: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();

    let pet_stats = PetStats {
        energy: 60,
        happiness: 50,
        hunger: 40,
    };

    let pet_game_data = PetGameData {
        coins: 20,
        experience: 0,
        level: 1
    };

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url,
        adopted_at: current_time,
        stats: pet_stats,
        game_data: pet_game_data
    };

    let pet_id = object::id(&pet);

    event::emit(PetAdopted {
        pet_id: pet_id,
        name: pet.name,
        adopted_at: pet.adopted_at
    });

    transfer::public_transfer(pet, ctx.sender());
}

public entry fun feed_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.hunger < gb.max_stat, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= gb.feed_coins_cost, E_NOT_ENOUGH_COINS);

    pet.game_data.coins = pet.game_data.coins - gb.feed_coins_cost;
    pet.game_data.experience = pet.game_data.experience + gb.feed_experience_gain;
    pet.stats.hunger = if (pet.stats.hunger + gb.feed_hunger_gain > gb.max_stat)
        gb.max_stat 
    else 
        pet.stats.hunger + gb.feed_hunger_gain;

    emit_action(pet, b"fed");
}

public entry fun play_with_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();
    assert!(pet.stats.energy >= gb.play_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.hunger >= gb.play_hunger_loss, E_PET_TOO_HUNGRY);

    pet.stats.energy = pet.stats.energy - gb.play_energy_loss;
    pet.stats.hunger = pet.stats.hunger - gb.play_hunger_loss;
    pet.game_data.experience = pet.game_data.experience + gb.play_experience_gain;
    pet.stats.happiness = if (pet.stats.happiness + gb.play_happiness_gain > gb.max_stat) 
        gb.max_stat 
    else 
        pet.stats.happiness + gb.play_happiness_gain;

    emit_action(pet, b"played");
}

public entry fun work_for_coins(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.energy >= gb.work_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.happiness >= gb.work_happiness_loss, E_PET_NOT_HUNGRY);
    assert!(pet.stats.hunger >= gb.work_hunger_loss, E_PET_TOO_HUNGRY);
    
    pet.stats.energy = if (pet.stats.energy >= gb.work_energy_loss)
        pet.stats.energy - gb.work_energy_loss
    else 
        0;
    pet.stats.happiness = if (pet.stats.happiness >= gb.work_happiness_loss)
        pet.stats.happiness - gb.work_happiness_loss
    else 
        0;
    pet.stats.hunger = if (pet.stats.hunger >= gb.work_hunger_loss)
        pet.stats.hunger - gb.work_hunger_loss
    else 
        0;
    pet.game_data.coins = pet.game_data.coins + gb.work_coins_gain;
    pet.game_data.experience = pet.game_data.experience + gb.work_experience_gain;

    emit_action(pet, b"worked");
}

public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    assert!(!is_sleeping(pet), E_PET_IS_ALREADY_ASLEEP);

    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());

    pet.image_url = string::utf8(PET_SLEEP_IMAGE_URL);

    emit_action(pet, b"started_sleeping");
}

public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    assert!(is_sleeping(pet), E_PET_IS_ASLEEP);
    
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove<String, u64>(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;

    let gb = get_game_balance();

    // Calculate energy gained
    let energy_gained_u64 = duration_ms / gb.sleep_energy_gain_ms;
    // Cap energy gain to max_stat
    let energy_gained = if (energy_gained_u64 > (gb.max_stat as u64)) {
        gb.max_stat 
    } else {
        (energy_gained_u64 as u8)
    };
    pet.stats.energy = if (pet.stats.energy + energy_gained > gb.max_stat) gb.max_stat else pet.stats.energy + energy_gained;

    // Calculate happiness lost
    let happiness_lost_u64 = duration_ms / gb.sleep_happiness_loss_ms;
    let happiness_lost = if (happiness_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (happiness_lost_u64 as u8)
    };
    pet.stats.happiness = if (pet.stats.happiness > happiness_lost) pet.stats.happiness - happiness_lost else 0;

    // Calculate hunger lost
    let hunger_lost_u64 = duration_ms / gb.sleep_hunger_loss_ms;
    let hunger_lost = if (hunger_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (hunger_lost_u64 as u8)
    };
    pet.stats.hunger = if (pet.stats.hunger > hunger_lost) pet.stats.hunger - hunger_lost else 0;

    update_pet_image(pet);

    emit_action(pet, b"woke_up");
}


public entry fun check_and_level_up(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    // Calculate required exp: level * exp_per_level
    let required_exp = (pet.game_data.level as u64) * gb.exp_per_level;
    assert!(pet.game_data.experience >= required_exp, E_NOT_ENOUGH_EXP);

    // Level up
    pet.game_data.level = pet.game_data.level + 1;
    pet.game_data.experience = pet.game_data.experience - required_exp;
    
    // Update image based on level and equipped accessory
    update_pet_image(pet);

    emit_action(pet, b"leveled_up")
}

public entry fun mint_accessory(ctx: &mut TxContext) {
    let accessory = PetAccessory {
        id: object::new(ctx),
        name: string::utf8(b"cool glasses"),
        image_url: string::utf8(ACCESSORY_GLASSES_IMAGE_URL)
    };
    transfer::public_transfer(accessory, ctx.sender());
}

public entry fun equip_accessory(pet: &mut Pet, accessory: PetAccessory) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(!dynamic_field::exists_<String>(&pet.id, copy key), E_ITEM_ALREADY_EQUIPPED);

    // Add accessory to pet
    dynamic_field::add(&mut pet.id, key, accessory);
    // Update image
    update_pet_image(pet);
    emit_action(pet, b"equipped_item");
}

public entry fun unequip_accessory(pet: &mut Pet, ctx: &mut TxContext) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(dynamic_field::exists_<String>(&pet.id, key), E_NO_ITEM_EQUIPPED);

    // Remove accessory
    let accessory: PetAccessory = dynamic_field::remove<String, PetAccessory>(&mut pet.id, key);
    // Update image
    update_pet_image(pet);

    transfer::transfer(accessory, ctx.sender());
    emit_action(pet, b"unequipped_item");
}

// === Marketplace API ===

/// List a pet for sale. Transfers the pet into marketplace custody.
public entry fun list_pet(market: &mut Marketplace, pet: Pet, price: u64, ctx: &mut TxContext) {
    let pet_id = object::id(&pet);
    let listing = PetListing { id: object::new(ctx), pet, seller: ctx.sender(), price };
    dynamic_field::add(&mut market.id, pet_id, listing);
}

/// Cancel a listing and return the pet to the original seller.
public entry fun cancel_listing(market: &mut Marketplace, pet_id: ID, ctx: &mut TxContext) {
    assert!(dynamic_field::exists_<ID>(&market.id, pet_id), E_LISTING_NOT_FOUND);
    let listing: PetListing = dynamic_field::remove<ID, PetListing>(&mut market.id, pet_id);
    // Only seller can cancel
    let PetListing { id, pet, seller, price: _ } = listing;
    object::delete(id);
    assert!(seller == ctx.sender(), E_FRIEND_NOT_FOUND); // reuse an error for unauthorized
    transfer::public_transfer(pet, seller);
    // Listing object will be dropped
}

/// Buy a listed pet by paying the exact or higher price in SUI. Excess is returned as change.
public entry fun buy_listed_pet(
    market: &mut Marketplace,
    pet_id: ID,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext
) {
    assert!(dynamic_field::exists_<ID>(&market.id, pet_id), E_LISTING_NOT_FOUND);
    let listing: PetListing = dynamic_field::remove<ID, PetListing>(&mut market.id, pet_id);

    let total = coin::value(&payment);
    assert!(total >= listing.price, E_INSUFFICIENT_PAYMENT);

    // Return change if buyer overpaid
    if (total > listing.price) {
        let change_amount = total - listing.price;
        let change = coin::split(&mut payment, change_amount, ctx);
        transfer::public_transfer(change, ctx.sender());
    };

    // Pay seller and transfer pet to buyer
    let PetListing { id, pet, seller, price: _ } = listing;
    object::delete(id);
    transfer::public_transfer(payment, seller);
    transfer::public_transfer(pet, ctx.sender());
}

/// Buy the predefined super pet from the shop. Mints a fresh pet and pays the shop owner.
public entry fun buy_super_pet(
    market: &mut Marketplace,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let shop_key = string::utf8(b"shop_super");
    assert!(dynamic_field::exists_<String>(&market.id, shop_key), E_LISTING_NOT_FOUND);
    let mut shop: ShopListing = dynamic_field::remove<String, ShopListing>(&mut market.id, copy shop_key);
    assert!(shop.stock > 0, E_NO_STOCK);

    let total = coin::value(&payment);
    assert!(total >= shop.price, E_INSUFFICIENT_PAYMENT);
    if (total > shop.price) {
        let change_amount = total - shop.price;
        let change = coin::split(&mut payment, change_amount, ctx);
        transfer::public_transfer(change, ctx.sender());
    };
    // Pay shop owner
    transfer::public_transfer(payment, shop.owner);

    // Mint the super pet for buyer
    let pet_stats = PetStats { energy: shop.energy, happiness: shop.happiness, hunger: shop.hunger };
    let pet_game_data = PetGameData { coins: shop.coins, experience: shop.experience, level: shop.level };
    let pet = Pet {
        id: object::new(ctx),
        name: shop.name,
        image_url: shop.image_url,
        adopted_at: clock.timestamp_ms(),
        stats: pet_stats,
        game_data: pet_game_data,
    };
    transfer::public_transfer(pet, ctx.sender());

    // Decrement stock and store shop listing back
    shop.stock = shop.stock - 1;
    dynamic_field::add(&mut market.id, shop_key, shop);
}

// === Helper Functions ===
fun emit_action(pet: &Pet, action: vector<u8>) {
    event::emit(PetAction {
        pet_id: object::id(pet),
        action: string::utf8(action),
        energy: pet.stats.energy,
        happiness: pet.stats.happiness,
        hunger: pet.stats.hunger,
    });
}

fun update_pet_image(pet: &mut Pet) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    let has_accessory = dynamic_field::exists_<String>(&pet.id, key);
    
    if (pet.game_data.level == 1) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_URL);
        }
    } else if (pet.game_data.level == 2) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_URL);
        }
    } else if (pet.game_data.level >= 3) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_URL);
        }
    };
}

// === View Functions ===
public fun get_pet_name(pet: &Pet): String { pet.name }
public fun get_pet_adopted_at(pet: &Pet): u64 { pet.adopted_at }
public fun get_pet_coins(pet: &Pet): u64 { pet.game_data.coins }
public fun get_pet_experience(pet: &Pet): u64 { pet.game_data.experience }
public fun get_pet_level(pet: &Pet): u8 { pet.game_data.level }
public fun get_pet_energy(pet: &Pet): u8 { pet.stats.energy }
public fun get_pet_hunger(pet: &Pet): u8 { pet.stats.hunger }
public fun get_pet_happiness(pet: &Pet): u8 { pet.stats.happiness }

public fun get_pet_stats(pet: &Pet): (u8, u8, u8) {
    (pet.stats.energy, pet.stats.hunger, pet.stats.happiness)
}
public fun get_pet_game_data(pet: &Pet): (u64, u64, u8) {
    (pet.game_data.coins, pet.game_data.experience, pet.game_data.level)
}

public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}

// === Test-Only Functions ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(TAMAGOSUI {}, ctx);
}
