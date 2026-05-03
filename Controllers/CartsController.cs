using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelStore.Models;
using ModelStore.Data;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CartsController(ApplicationDbContext db) => _db = db;

        [HttpGet("{customerId}")]
        public async Task<IActionResult> GetCart(int customerId)
        {
            var cart = await _db.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
            {
                cart = new Cart { CustomerId = customerId };
                _db.Carts.Add(cart);
                await _db.SaveChangesAsync();
            }
            return Ok(cart);
        }

        [HttpPost("{customerId}/add")]
        public async Task<IActionResult> AddToCart(int customerId, [FromBody] CartItem item)
        {
            var cart = await _db.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
            {
                cart = new Cart { CustomerId = customerId };
                _db.Carts.Add(cart);
                await _db.SaveChangesAsync();
            }

            var existingItem = cart.Items.FirstOrDefault(i => i.ModelId == item.ModelId);
            if (existingItem != null)
            {
                existingItem.Quantity += item.Quantity;
            }
            else
            {
                item.CartId = cart.Id;
                cart.Items.Add(item);
            }

            await _db.SaveChangesAsync();
            return Ok(cart);
        }

        [HttpDelete("{customerId}/remove/{modelId}")]
        public async Task<IActionResult> RemoveFromCart(int customerId, int modelId)
        {
            var cart = await _db.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null) return NotFound("Cart not found");

            var item = cart.Items.FirstOrDefault(i => i.ModelId == modelId);
            if (item == null) return NotFound("Item not found in cart");

            cart.Items.Remove(item);
            await _db.SaveChangesAsync();
            return Ok(cart);
        }

        [HttpDelete("{customerId}/clear")]
        public async Task<IActionResult> ClearCart(int customerId)
        {
            var cart = await _db.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null) return NotFound("Cart not found");

            cart.Items.Clear();
            await _db.SaveChangesAsync();
            return Ok(new { message = "Cart cleared" });
        }
    }
}
